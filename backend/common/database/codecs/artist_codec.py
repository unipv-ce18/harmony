from bson import ObjectId

from common.model import Artist, Release, Song
from ..contracts import artist_contract as c


_ARTIST_DOCUMENT_BINDINGS = {
    'id': c.ARTIST_ID,
    'creator': c.ARTIST_CREATOR,
    'name': c.ARTIST_NAME,
    'sort_name': c.ARTIST_SORT_NAME,
    'country': c.ARTIST_COUNTRY,
    'life_span': c.ARTIST_LIFE_SPAN,
    'genres': c.ARTIST_GENRES,
    'bio': c.ARTIST_BIO,
    'members': c.ARTIST_MEMBERS,
    'links': c.ARTIST_LINKS,
    'image': c.ARTIST_IMAGE,
    'releases': c.ARTIST_RELEASES
}

_RELEASE_DOCUMENT_BINDINGS = {
    'id': c.RELEASE_ID,
    'name': c.RELEASE_NAME,
    'date': c.RELEASE_DATE,
    'artist': c.RELEASE_ARTIST_REF,
    'type': c.RELEASE_TYPE,
    'cover': c.RELEASE_COVER,
    'songs': c.RELEASE_SONGS
}

_SONG_DOCUMENT_BINDINGS = {
    'id': c.SONG_ID,
    'title': c.SONG_TITLE,
    'artist': c.SONG_ARTIST_REF,
    'release': c.SONG_RELEASE_REF,
    'length': c.SONG_LENGTH,
    'lyrics': c.SONG_LYRICS,
    'repr_data': c.SONG_REPRESENTATION_DATA
}

# Fields that may cause trouble if inserted in a document bypassing checks
_UNSAFE_ARTIST_FIELDS = [c.ARTIST_ID, c.ARTIST_RELEASES]
_UNSAFE_RELEASE_FIELDS = [c.RELEASE_ID, c.RELEASE_SONGS, c.RELEASE_ARTIST_REF]
_UNSAFE_SONG_FIELDS = [c.SONG_ID, c.SONG_ARTIST_REF, c.SONG_RELEASE_REF, c.SONG_REPRESENTATION_DATA]


def _artist_ref_to_document(artist_ref_data):
    return {
        c.ARTIST_REF_ID: ObjectId(artist_ref_data['id']),
        c.ARTIST_REF_NAME: artist_ref_data['name']
    }


def _artist_ref_from_document(doc):
    return {
        'id': str(doc[c.ARTIST_REF_ID]),
        'name': doc[c.ARTIST_REF_NAME]
    }


def _release_ref_to_document(release_ref_data):
    return {
        c.RELEASE_REF_ID: ObjectId(release_ref_data['id']),
        c.RELEASE_REF_NAME: release_ref_data['name'],
        c.RELEASE_REF_DATE: release_ref_data['date'],
        c.RELEASE_REF_TYPE: release_ref_data['type'],
        c.RELEASE_REF_COVER: release_ref_data['cover']
    }


def _release_ref_from_document(doc):
    return {
        'id': str(doc[c.RELEASE_REF_ID]),
        'name': doc[c.RELEASE_REF_NAME],
        'date': doc[c.RELEASE_REF_DATE],
        'type': doc[c.RELEASE_REF_TYPE],
        'cover': doc[c.RELEASE_REF_COVER]
    }


def artist_from_document(doc: dict) -> Artist:
    if doc is None:
        doc = {}

    def get_prop(k):
        if k == c.ARTIST_ID:
            return str(doc[c.ARTIST_ID]) \
                if c.ARTIST_ID in doc else None
        if k == c.ARTIST_CREATOR:
            return str(doc[c.ARTIST_CREATOR]) \
                if c.ARTIST_CREATOR in doc else None
        if k == c.ARTIST_RELEASES:
            releases = doc.get(c.ARTIST_RELEASES)
            return [release_from_document(release) for release in releases] \
                if releases is not None else None
        return doc.get(k)

    return Artist(**{model_property: get_prop(doc_field)
                     for model_property, doc_field in _ARTIST_DOCUMENT_BINDINGS.items()})


def artist_to_document(artist: Artist, strip_unsafe=True) -> dict:
    doc = {doc_field: getattr(artist, model_property)
           for model_property, doc_field in _ARTIST_DOCUMENT_BINDINGS.items()
           if doc_field not in _UNSAFE_ARTIST_FIELDS}
    doc[c.ARTIST_CREATOR] = ObjectId(artist.creator)

    if not strip_unsafe:
        doc[c.ARTIST_ID] = ObjectId(artist.id)
        doc[c.ARTIST_RELEASES] = [release_to_document(r) for r in artist.releases]

    return doc


def release_from_document(doc: dict) -> Release:
    if doc is None:
        doc = {}

    def get_prop(k):
        if k == c.RELEASE_ID:
            return str(doc[c.RELEASE_ID]) \
                if c.RELEASE_ID in doc else None
        if k == c.RELEASE_SONGS:
            songs = doc.get(c.RELEASE_SONGS)
            return [song_from_document(song) for song in songs] \
                if songs is not None else None
        if k == c.RELEASE_ARTIST_REF:
            return _artist_ref_from_document(doc[c.RELEASE_ARTIST_REF]) \
                if c.RELEASE_ARTIST_REF in doc else None
        return doc.get(k)

    return Release(**{model_property: get_prop(doc_field)
                      for model_property, doc_field in _RELEASE_DOCUMENT_BINDINGS.items()})


def release_to_document(release: Release, strip_unsafe=True) -> dict:
    doc = {doc_field: getattr(release, model_property)
           for model_property, doc_field in _RELEASE_DOCUMENT_BINDINGS.items()
           if doc_field not in _UNSAFE_RELEASE_FIELDS}

    if not strip_unsafe:
        doc[c.RELEASE_ID] = ObjectId(release.id)
        doc[c.RELEASE_SONGS] = [song_to_document(s) for s in release.songs]
        doc[c.RELEASE_ARTIST_REF] = _artist_ref_to_document(release.artist)
    return doc


def song_from_document(doc: dict) -> Song:
    if doc is None:
        doc = {}

    def get_prop(k):
        if k == c.SONG_ID:
            return str(doc[c.SONG_ID]) \
                if c.SONG_ID in doc else None
        if k == c.SONG_ARTIST_REF:
            return _artist_ref_from_document(doc[c.SONG_ARTIST_REF]) \
                if c.SONG_ARTIST_REF in doc else None
        if k == c.SONG_RELEASE_REF:
            return _release_ref_from_document(doc[c.SONG_RELEASE_REF]) \
                if c.SONG_RELEASE_REF in doc else None
        return doc.get(k)

    return Song(**{model_property: get_prop(doc_field)
                   for model_property, doc_field in _SONG_DOCUMENT_BINDINGS.items()})


def song_to_document(song: Song, strip_unsafe=True) -> dict:
    doc = {doc_field: getattr(song, model_property)
           for model_property, doc_field in _SONG_DOCUMENT_BINDINGS.items()
           if doc_field not in _UNSAFE_SONG_FIELDS}

    if not strip_unsafe:
        doc[c.SONG_ID] = ObjectId(song.id)
        #doc[c.SONG_ARTIST_REF] = _artist_ref_to_document(song.artist)
        #doc[c.SONG_RELEASE_REF] = _release_ref_to_document(song.release)
        #doc[c.SONG_REPRESENTATION_DATA] = song.repr_data
    return doc
