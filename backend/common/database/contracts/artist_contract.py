COLLECTION_NAME = 'artists'

# Artist document fields
ARTIST_ID = '_id'
ARTIST_NAME = 'name'
ARTIST_SORT_NAME = 'sort_name'
ARTIST_COUNTRY = 'country'
ARTIST_LIFE_SPAN = 'life_span'
ARTIST_GENRES = 'genres'
ARTIST_BIO = 'bio'
ARTIST_MEMBERS = 'members'
ARTIST_LINKS = 'links'
ARTIST_IMAGE = 'image'
ARTIST_RELEASES = 'releases'

# Release sub-document fields
RELEASE_ID = '_id'
RELEASE_NAME = 'name'
RELEASE_DATE = 'date'
RELEASE_ARTIST_REF = 'artist'
RELEASE_TYPE = 'type'
RELEASE_COVER = 'cover'
RELEASE_SONGS = 'songs'

# Song sub-document fields
SONG_ID = '_id'
SONG_TITLE = 'title'
SONG_ARTIST_REF = 'artist'
SONG_RELEASE_REF = 'release'
SONG_LENGTH = 'length'
SONG_LYRICS = 'lyrics'
SONG_LINKS = 'links'
SONG_REFERENCE_URL = 'reference_url'
SONG_REPRESENTATION_DATA = 'repr_data'

# Artist reference fields
ARTIST_REF_ID = 'id'
ARTIST_REF_NAME = 'name'

# Release reference fields
RELEASE_REF_ID = 'id'
RELEASE_REF_NAME = 'name'
RELEASE_REF_DATE = 'date'
RELEASE_REF_TYPE = 'type'
RELEASE_REF_COVER = 'cover'

# Path helpers to match on collection indexes
INDEX_RELEASE_ID = f'{ARTIST_RELEASES}.{RELEASE_ID}'
INDEX_RELEASE_NAME = f'{ARTIST_RELEASES}.{RELEASE_NAME}'
INDEX_SONG_ID = f'{ARTIST_RELEASES}.{RELEASE_SONGS}.{SONG_ID}'
INDEX_SONG_TITLE = f'{ARTIST_RELEASES}.{RELEASE_SONGS}.{SONG_TITLE}'
