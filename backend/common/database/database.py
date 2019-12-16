from .ops_user import UserOpsMixin
from .ops_token import TokenOpsMixin
from .ops_artist import ArtistOpsMixin
from .ops_release import ReleaseOpsMixin
from .ops_song import SongOpsMixin


# This is because Python...
class _DbBase(object):
    def __init__(self, *args, **kwargs):
        pass


class Database(
        UserOpsMixin,
        TokenOpsMixin,
        ArtistOpsMixin,
        ReleaseOpsMixin,
        SongOpsMixin,
        _DbBase):

    def __init__(self, db_connection):
        super().__init__(db_connection)

    def search(self, item):
        # TODO: Structure of search results is a job of the API and not the database module,
        #       remove this and embed in /search Flask resource
        return {
            'artists': self.search_artist(item),
            'releases': self.search_release(item),
            'songs': self.search_song(item)
        }
