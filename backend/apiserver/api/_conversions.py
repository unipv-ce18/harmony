from dataclasses import asdict

from flask import current_app

from common.model import Artist, Release, Song
from common.storage import get_storage_base_url


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
