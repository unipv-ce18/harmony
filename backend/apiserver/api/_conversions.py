from dataclasses import asdict

from flask import current_app

from . import db
from common.model import Artist, Release, Song, Playlist
from common.storage import get_storage_base_url
from common.database.contracts import playlist_contract as c


_SUFFIXES = {'jr.', 'Jr.', 'jr', 'Jr', 'jnr', 'Jnr', 'sr.', 'Sr.', 'sr', 'Sr', 'snr', 'Snr', 'II', 'III', 'IV'}
_ARTICLES = {'a', 'an', 'the', 'el', 'la', 'los', 'las', 'il', 'lo', 'la', 'i', 'gli', 'le'}
_DE_STYLIZE = {
    '$': 's',
    '!': 'i',
    '€': 'e',
    '{}': '',
    '[]': '',
    '()': '',
    '*': ''
}


def create_sort_name(name):
    suffixes = [suf for suf in _SUFFIXES if suf in name.split()]
    begin_word = name.split()[0].lower()

    join_name = lambda name, limit : \
        ''.join([f'{w} ' if (c < len(name) - limit) else f'{w}' for c, w in enumerate(name)])

    # check for suffixes in artist name
    if suffixes:
        name = name.split()
        for suf in suffixes:
            index = name.index(suf)
            name += [f', {name.pop(index)}']
        name = join_name(name, len(suffixes) + 1)

    # check if the artist name begins with an article
    if begin_word in _ARTICLES:
        name = name.split()
        name += [f', {name.pop(0)}']
        name = join_name(name, 2)

    # de-stylize the artist name
    name = name.split()
    for c, word in enumerate(name):
        to_title = False
        for k, v in _DE_STYLIZE.items():
            if k in word:
                to_title = word[0] == k or to_title
                word = word.replace(k, v)
                name[c] = word
            if to_title:
                name[c] = name[c].title()
    name = join_name(name, 1)

    return name


def _get_image_url(image_id):
    conf = current_app.config
    return get_storage_base_url(conf) + conf['STORAGE_BUCKET_IMAGES'] + '/' + image_id


def create_artist_result(artist: Artist):
    artist_dict = asdict(artist)
    artist_dict['image'] = _get_image_url(artist.image) if artist.image is not None else None

    if artist.releases is None:
        del artist_dict['releases']
    else:
        artist_dict['releases'] = [create_release_result(r, strip_refs=True) for r in artist.releases]

    return artist_dict


def create_release_result(release: Release, strip_refs=False):
    release_dict = asdict(release)
    release_dict['cover'] = _get_image_url(release.cover) if release.cover is not None else None

    if release.songs is None:
        del release_dict['songs']
    else:
        release_dict['songs'] = [create_song_result(s, strip_refs=True) for s in release.songs]

    if strip_refs:
        del release_dict['artist']

    return release_dict


def create_song_result(song: Song, strip_refs=False):
    song_dict = asdict(song)
    if 'repr_data' in song_dict:  # can be absent in search result projection
        del song_dict['repr_data']

    if strip_refs:
        del song_dict['artist']
        del song_dict['release']
    else:
        if song.release is not None:
            cover_url = _get_image_url(song.release['cover']) if song.release.get('cover') is not None else None
            song_dict['release']['cover'] = cover_url

    return song_dict


def create_playlist_result(playlist: Playlist, include_songs=False):
    playlist_dict = playlist.to_dict()

    if playlist_dict[c.PLAYLIST_IMAGES]:
        playlist_dict[c.PLAYLIST_IMAGES] = [_get_image_url(cover) for cover in playlist_dict[c.PLAYLIST_IMAGES][:4]]

    if include_songs:
        playlist_dict[c.PLAYLIST_SONGS] = [create_song_result(db.get_song(song_id))
                                            for song_id in playlist_dict[c.PLAYLIST_SONGS]]

    return playlist_dict
