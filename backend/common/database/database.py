from .ops_user import UserOpsMixin
from .ops_token import TokenOpsMixin
from .ops_artist import ArtistOpsMixin
from .ops_release import ReleaseOpsMixin
from .ops_song import SongOpsMixin
from .ops_orchestrator import OrchestratorOpsMixin
from .ops_playlist import PlaylistOpsMixin
from .ops_upload import UploadOpsMixin


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
        OrchestratorOpsMixin,
        PlaylistOpsMixin,
        UploadOpsMixin,
        _DbBase):

    def __init__(self, db_connection):
        super().__init__(db_connection)
