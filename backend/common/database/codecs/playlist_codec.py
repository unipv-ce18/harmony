from bson import ObjectId

from common.model import Playlist
from ..contracts import playlist_contract as c


_PLAYLIST_DOCUMENT_BINDINGS = {
    'id': c.PLAYLIST_ID,
    'name': c.PLAYLIST_NAME,
    'creator': c.PLAYLIST_CREATOR,
    'image': c.PLAYLIST_IMAGE,
    'policy': c.PLAYLIST_POLICY,
    'songs': c.PLAYLIST_SONGS
}


# Fields that may cause trouble if inserted in a document bypassing checks
_UNSAFE_PLAYLIST_FIELDS = [c.PLAYLIST_ID]


def playlist_from_document(doc: dict) -> Playlist:
    if doc is None:
        doc = {}

    def get_prop(k):
        if k == c.PLAYLIST_ID:
            return str(doc[c.PLAYLIST_ID]) \
                if c.PLAYLIST_ID in doc else None
        return doc.get(k)

    return Playlist(**{model_property: get_prop(doc_field)
                     for model_property, doc_field in _PLAYLIST_DOCUMENT_BINDINGS.items()})


def playlist_to_document(playlist: Playlist, strip_unsafe=True) -> dict:
    doc = {doc_field: getattr(playlist, model_property)
           for model_property, doc_field in _PLAYLIST_DOCUMENT_BINDINGS.items()
           if doc_field not in _UNSAFE_PLAYLIST_FIELDS}

    if not strip_unsafe:
        doc[c.PLAYLIST_ID] = ObjectId(playlist.id)

    return doc
