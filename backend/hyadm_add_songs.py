import argparse
import json
import os
import sys
import urllib.parse
from glob import glob
from http.client import HTTPConnection

from apiserver.config import current_config as config
from common.database import Database, connect_db
from common.database.codec import artist_from_document, release_from_document, song_from_document
from common.storage import get_storage_interface


def _http_get_json(host, path, params):
    conn = HTTPConnection(host)
    full_path = path if params is None else f'{path}?{urllib.parse.urlencode(params)}'
    conn.request('GET', full_path, headers={'User-Agent': 'python-harmony/0.1'})
    res = conn.getresponse()
    ret = (json.loads(res.read()), res.getcode())
    conn.close()
    return ret


def extract_tags_flac(file_path):
    def _parse_vorbis_comment(raw):
        # https://www.xiph.org/vorbis/doc/v-comment.html
        if bytes is None:
            return None
        vendor_len = int.from_bytes(raw[0:3], byteorder='little', signed=False)
        # For example: raw[4:vendor_len] == b'reference libFLAC 1.3.1 2014'
        pos = 4 + vendor_len
        comment_list_len = int.from_bytes(raw[pos:pos + 4], byteorder='little', signed=False)
        pos += 4

        tags = {}
        for i in range(0, comment_list_len):
            field_len = int.from_bytes(raw[pos:pos + 4], byteorder='little', signed=True)
            field_kv = raw[pos + 4:pos + 4 + field_len].decode('utf-8').split('=', 1)
            tags[field_kv[0]] = field_kv[1]
            pos += 4 + field_len
        assert pos == len(raw), 'Vorbis comment block not completely processed'
        return tags

    def _get_track_len(stream_info):
        # https://xiph.org/flac/format.html#metadata_block_streaminfo
        sample_and_chan = int.from_bytes(stream_info[10:13], byteorder='big', signed=False)
        sampling_raw = sample_and_chan >> 3
        channel_count = sample_and_chan & 0x03
        sample_count = int.from_bytes(stream_info[13:18], byteorder='big', signed=False) & 0x0fffffffff
        return int(sample_count * channel_count / sampling_raw * 1000)

    # https://xiph.org/flac/format.html
    block_streaminfo = None
    block_vorbis_comment = None
    with open(file_path, 'rb') as f:
        if f.read(4) != b'fLaC':
            raise ValueError('Not a valid FLAC file')
        while True:
            block_t = f.read(1)[0]
            block_sz = int.from_bytes(f.read(3), byteorder='big', signed=False)
            if block_t & 0x7f == 0:  # Block type 0 is STREAMINFO
                block_streaminfo = f.read(block_sz)
            elif block_t & 0x7f == 4:  # Block type 4 is VORBIS_COMMENT
                block_vorbis_comment = f.read(block_sz)
            else:
                f.seek(block_sz, os.SEEK_CUR)
            if block_t & 0x80:  # If 1st bit of type is set, this is the last
                break
    return _parse_vorbis_comment(block_vorbis_comment), _get_track_len(block_streaminfo)


def lfm_get_artist_info(artist_name):
    info_json, code = _http_get_json('ws.audioscrobbler.com', '/2.0/', {
        'method': 'artist.getinfo',
        'artist': urllib.parse.quote(artist_name),
        'api_key': lastfm_api_key,
        'format': 'json'
    })
    if code != 200:
        raise RuntimeError('Last.fm API was not OK with this')
    return {
               'bio': info_json['artist']['bio']['summary'],
               'genres': [tag['name'] for tag in info_json['artist']['tags']['tag']]
           }, info_json['artist']['mbid']


def mb_get_artist_info(mbid):
    info_json, code = _http_get_json('musicbrainz.org', f'/ws/2/artist/{mbid}', {
        'fmt': 'json'
    })
    if code == 403:
        raise RuntimeError(info_json['error'])
    return {
        'name': info_json['name'],
        'sort_name': info_json['sort-name'],
        'country': info_json['country'],
        # better be explicit
        'life_span': {'begin': info_json['life-span']['begin'], 'end': info_json['life-span']['end']}
    }


def make_tree(files):
    tree = {}
    for f in files:
        try:
            tags, track_len = extract_tags_flac(f)
            artist = tags.get('ALBUMARTIST') or tags['ARTIST']
            release = tags['ALBUM']
            song = tags['TITLE']
            track_num = tags['TRACKNUMBER']
            lyrics = tags.get('LYRICS') or tags.get('UNSYNCED LYRICS')
            if artist not in tree:
                tree[artist] = {'releases': {}}
            if release not in tree[artist]['releases']:
                tree[artist]['releases'][release] = {'songs': {}, 'date': tags.get('DATE')}
            tree[artist]['releases'][release]['songs'][track_num] = \
                {'title': song, 'length': track_len, 'lyrics': lyrics, 'file': f}
        except KeyError as e:
            print(f'Track "{f}" skipped since it has missing tags, {e}', file=sys.stderr)
    return tree


def create_artist(name):
    if lastfm_api_key is None:
        artist_doc = {'name': name, 'sort_name': name}
    else:
        lfm_data, mbid = lfm_get_artist_info(name)
        mb_data = mb_get_artist_info(mbid)
        artist_doc = {**lfm_data, **mb_data}
    return artist_from_document(artist_doc)


def get_or_put_artist(name):
    artist_result = db.search_artist(name, limit=1)
    if len(artist_result) != 0 and artist_result[0].name == name:
        artist_id = artist_result[0].id
        state = 'SKIP'
    else:
        artist_id = db.put_artist(create_artist(name))
        state = 'NEW'
    print(f'Artist "{name}" ({artist_id}) [{state}]', file=sys.stderr)
    return artist_id


def create_release(name, data):
    # Put here MB or LFM calls to enrich metadata
    return release_from_document({'name': name, 'date': data['date'], 'type': 'album'})


def get_or_put_release(artist_id, release_name, release_data):
    release_result = db.search_release(release_name)
    for found_rel in release_result:
        if found_rel.name == release_name and found_rel.artist['id'] == artist_id:
            print(f'  Release "{release_name}" ({found_rel.id}) [SKIP]', file=sys.stderr)
            return found_rel.id

    release_id = db.put_release(artist_id, create_release(release_name, release_data))
    print(f'  Release "{release_name}" ({release_id}) [NEW]', file=sys.stderr)
    return release_id


def create_song(data):
    return song_from_document({'title': data['title'], 'length': data['length'], 'lyrics': data['lyrics']})


def get_or_put_song(release_id, song_data):
    song_result = db.search_song(song_data['title'])
    for found_song in song_result:
        if found_song.title == song_data['title'] and found_song.release['id'] == release_id:
            print(f'    Song "{song_data["title"]}" ({found_song.id}) [SKIP]', file=sys.stderr)
            return found_song.id

    song_id = db.put_song(release_id, create_song(song_data))
    print(f'    Song "{song_data["title"]}" ({song_id}) [NEW]', file=sys.stderr)

    st.minio_client.fput_object(config.STORAGE_BUCKET_REFERENCE, f'{song_id}.flac', song_data['file'])
    print(f'      > uploaded "{song_data["file"]}"', file=sys.stderr)


def insert_data(tree):
    for artist_name, artist_data in tree.items():
        artist_id = get_or_put_artist(artist_name)

        for release_name, release_data in artist_data['releases'].items():
            release_id = get_or_put_release(artist_id, release_name, release_data)

            song_keys = sorted(release_data['songs'].keys())
            for track_nr in song_keys:  # track numbers (as strings) in order
                get_or_put_song(release_id, release_data['songs'][track_nr])


arg_parser = argparse.ArgumentParser(description='Harmony CLI utility: Imports songs into the Harmony database')
arg_parser.add_argument('folder', metavar='FILES_DIR', type=str, help='the folder to scan recursively for files')
arg_parser.add_argument('--clean', action='store_true', help="clean the database and storage before adding")

args = arg_parser.parse_args()
if not os.path.isdir(args.folder):
    print(f'"{args.folder}" is not a folder', file=sys.stderr)
    sys.exit(1)

lastfm_api_key = os.environ.get('LASTFM_API_KEY')
if lastfm_api_key is None:
    print('LASTFM_API_KEY is not set (you can scrape for some on Google), tags and artist bio will not be loaded',
          file=sys.stderr)

db = Database(connect_db(config).get_database())
st = get_storage_interface(config)

if args.clean:
    db.artists.drop()
    st.delete_all_files(config.STORAGE_BUCKET_REFERENCE)
    st.delete_all_files(config.STORAGE_BUCKET_TRANSCODED)
    print('Cleaned up database and storage', file=sys.stderr)

songs = [os.path.join(dp, f) for dp, dn, filenames in os.walk(args.folder)
         for f in filenames if os.path.splitext(f)[1].lower() == '.flac']
meta_tree = make_tree(songs)
insert_data(meta_tree)
