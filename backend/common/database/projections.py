from .contracts import artist_contract as c

# Projection for an artist reference
# <https://github.com/unipv-ce18/harmony/wiki/API-Entity-Reference#artistref>
_ARTIST_REF_PROJECTION = {
    c.ARTIST_REF_ID: f'${c.ARTIST_ID}',
    c.ARTIST_REF_NAME: f'${c.ARTIST_NAME}'
}

# Projection for a release reference
# <https://github.com/unipv-ce18/harmony/wiki/API-Entity-Reference#releaseref>
_RELEASE_REF_PROJECTION = {
    c.RELEASE_REF_ID: f'${c.ARTIST_RELEASES}.{c.RELEASE_ID}',
    c.RELEASE_REF_NAME: f'${c.ARTIST_RELEASES}.{c.RELEASE_NAME}',
    c.RELEASE_REF_DATE: f'${c.ARTIST_RELEASES}.{c.RELEASE_DATE}',
    c.RELEASE_REF_TYPE: f'${c.ARTIST_RELEASES}.{c.RELEASE_TYPE}',
    c.RELEASE_REF_COVER: f'${c.ARTIST_RELEASES}.{c.RELEASE_COVER}'
}


def _prefix_projection(projection, prefix):
    new_projection = {}
    for k, v in projection.items():
        new_projection[f'{prefix}.{k}'] = v
    return new_projection


def artist_projection(include_releases=False):
    projection = {
        c.ARTIST_ID: f'${c.ARTIST_ID}',
        c.ARTIST_NAME: f'${c.ARTIST_NAME}',
        c.ARTIST_SORT_NAME: f'${c.ARTIST_SORT_NAME}',
        c.ARTIST_COUNTRY: f'${c.ARTIST_COUNTRY}',
        c.ARTIST_LIFE_SPAN: f'${c.ARTIST_LIFE_SPAN}',
        c.ARTIST_GENRES: f'${c.ARTIST_GENRES}',
        c.ARTIST_BIO: f'${c.ARTIST_BIO}',
        c.ARTIST_MEMBERS: f'${c.ARTIST_MEMBERS}',
        c.ARTIST_LINKS: f'${c.ARTIST_LINKS}',
        c.ARTIST_IMAGE: f'${c.ARTIST_IMAGE}'
    }
    if include_releases:
        projection.update(release_projection(c.ARTIST_RELEASES))
    return projection


def artist_projection_search_result():
    return {
        '_id': f'${c.ARTIST_ID}',
        'name': f'${c.ARTIST_NAME}',
        'image': f'${c.ARTIST_IMAGE}'
    }


def release_projection(prefix='', include_songs=False):
    projection = {
        c.RELEASE_ID: f'${c.ARTIST_RELEASES}.{c.RELEASE_ID}',
        c.RELEASE_NAME: f'${c.ARTIST_RELEASES}.{c.RELEASE_NAME}',
        c.RELEASE_DATE: f'${c.ARTIST_RELEASES}.{c.RELEASE_DATE}',
        c.RELEASE_TYPE: f'${c.ARTIST_RELEASES}.{c.RELEASE_TYPE}',
        c.RELEASE_COVER: f'${c.ARTIST_RELEASES}.{c.RELEASE_COVER}'
    }
    if include_songs:
        projection.update(song_projection(c.RELEASE_SONGS))

    if prefix == '':
        # This is to get a single release, include artist reference
        projection[c.RELEASE_ARTIST_REF] = _ARTIST_REF_PROJECTION
    else:
        # This is inside an artist projection, add prefix
        projection = _prefix_projection(projection, prefix)
    return projection


def release_projection_search_result():
    return {
        '_id': f'${c.ARTIST_RELEASES}.{c.RELEASE_ID}',
        'name': f'${c.ARTIST_RELEASES}.{c.RELEASE_NAME}',
        'artist': _ARTIST_REF_PROJECTION,
        'cover': f'${c.ARTIST_RELEASES}.{c.RELEASE_COVER}'
    }


def song_projection(prefix=''):
    projection = {
        c.SONG_ID: f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_ID}',
        c.SONG_TITLE: f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_TITLE}',
        c.SONG_LENGTH: f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_LENGTH}',
        c.SONG_LYRICS: f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_LYRICS}',
        c.SONG_REFERENCE_URL: f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_REFERENCE_URL}',
        c.SONG_REPRESENTATION_DATA: f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_REPRESENTATION_DATA}',
    }
    if prefix == '':
        # This is projection for a single song, include artist and release reference
        projection[c.SONG_ARTIST_REF] = _ARTIST_REF_PROJECTION
        projection[c.SONG_RELEASE_REF] = _RELEASE_REF_PROJECTION
    else:
        # This is inside an artist projection, add prefix
        projection = _prefix_projection(projection, prefix)
    return projection


def song_projection_search_result():
    return {
        '_id': f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_ID}',
        'title': f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_TITLE}',
        'artist': _ARTIST_REF_PROJECTION,
        'release': _RELEASE_REF_PROJECTION
    }
