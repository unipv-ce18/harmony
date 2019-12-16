# Projection for an artist reference
# <https://github.com/unipv-ce18/harmony/wiki/API-Entity-Reference#artistref>
_ARTIST_REF_PROJECTION = {
    'id': '$_id',
    'name': '$name'
}

# Projection for a release reference
# <https://github.com/unipv-ce18/harmony/wiki/API-Entity-Reference#releaseref>
_RELEASE_REF_PROJECTION = {
    'id': '$releases._id',
    'name': '$releases.name',
    'date': '$releases.date',
    'type': '$releases.type',
    'cover': '$releases.cover'
}


def _prefix_projection(projection, prefix):
    new_projection = {}
    for k, v in projection.items():
        new_projection[f'{prefix}.{k}'] = v
    return new_projection


def artist_projection(include_releases=False):
    projection = {
        'name': '$name',
        'sort_name': '$sort_name',
        'country': '$country',
        'life_span': '$life_span',
        'genres': '$genres',
        'bio': '$bio',
        'members': '$members',
        'links': '$links',
        'image': '$image'
    }
    if include_releases:
        projection.update(release_projection('releases'))
    return projection


def artist_projection_search_result():
    return {
        'name': '$name',
        'image': '$image'
    }


def release_projection(prefix='', include_songs=False):
    projection = {
        '_id': '$releases._id',
        'name': '$releases.name',
        'date': '$releases.date',
        'type': '$releases.type',
        'cover': '$releases.cover'
    }
    if include_songs:
        projection.update(song_projection('songs'))

    if prefix == '':
        # This is to get a single release, include artist reference
        projection['artist'] = _ARTIST_REF_PROJECTION
    else:
        # This is inside an artist projection, add prefix
        projection = _prefix_projection(projection, prefix)
    return projection


def release_projection_search_result():
    return {
        '_id': '$releases._id',
        'name': '$releases.name',
        'artist': _ARTIST_REF_PROJECTION,
        'cover': '$releases.cover'
    }


def song_projection(prefix=''):
    projection = {
        '_id': '$releases.songs._id',
        'title': '$releases.songs.title',
        'length': '$releases.songs.length',
        'lyrics': '$releases.songs.lyrics',
        'reference_url': '$releases.songs.reference_url',
        'repr_data': '$releases.songs.repr_data',
    }
    if prefix == '':
        # This is projection for a single song, include artist and release reference
        projection['artist'] = _ARTIST_REF_PROJECTION
        projection['release'] = _RELEASE_REF_PROJECTION
    else:
        # This is inside an artist projection, add prefix
        projection = _prefix_projection(projection, prefix)
    return projection


def song_projection_search_result():
    return {
        '_id': '$releases.songs._id',
        'title': '$releases.songs.title',
        'artist': _ARTIST_REF_PROJECTION,
        'release': _RELEASE_REF_PROJECTION
    }
