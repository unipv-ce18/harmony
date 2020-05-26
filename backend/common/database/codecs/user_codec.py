from bson import ObjectId

from common.model import User
from ..contracts import user_contract as c


_USER_DOCUMENT_BINDINGS = {
    'id' : c.USER_ID,
    'type': c.USER_TYPE,
    'tier': c.USER_TIER,
    'first_name': c.USER_FIRST_NAME,
    'last_name': c.USER_LAST_NAME,
    'username': c.USER_USERNAME,
    'email': c.USER_EMAIL,
    'password': c.USER_PASSWORD,
    'bio': c.USER_BIO,
    'location': c.USER_LOCATION,
    'avatar_url': c.USER_AVATAR_URL,
    'stats': c.USER_STATS,
    'prefs': c.USER_PREFS
}


# Fields that may cause trouble if inserted in a document bypassing checks
_UNSAFE_USER_FIELDS = [c.USER_ID]


def _user_ref_to_document(user_ref_data):
    return {
        c.USER_REF_ID: ObjectId(user_ref_data['id']),
        c.USER_REF_USERNAME: user_ref_data['username'],
        c.USER_REF_EMAIL: user_ref_data['email']
    }


def _user_ref_from_document(doc):
    return {
        'id': str(doc[c.USER_REF_ID]),
        'username': doc[c.USER_REF_USERNAME],
        'email': doc[c.USER_REF_EMAIL]
    }


def user_from_document(doc: dict) -> User:
    if doc is None:
        doc = {}

    def get_prop(k):
        if k == c.USER_ID:
            return str(doc[c.USER_ID]) \
                if c.USER_ID in doc else None
        return doc.get(k)

    return User(**{model_property: get_prop(doc_field)
                     for model_property, doc_field in _USER_DOCUMENT_BINDINGS.items()})


def user_to_document(user: User, strip_unsafe=True) -> dict:
    doc = {doc_field: getattr(user, model_property)
           for model_property, doc_field in _USER_DOCUMENT_BINDINGS.items()
           if doc_field not in _UNSAFE_USER_FIELDS}

    if not strip_unsafe:
        doc[c.USER_ID] = ObjectId(user.id)

    return doc
