from dataclasses import dataclass, asdict
from typing import Optional, List

from .song import Song


@dataclass
class Release:

    id: Optional[str]
    """This release's database ID or `None`"""

    name: str
    """The name of this release"""

    date: str
    """Date of publication for this release"""

    artist: Optional[dict]
    """A reference to the artist that made this release or `None` if this is embedded inside an Artist document"""

    type: str
    """The type of this release (e.g. `album`)"""

    cover: Optional[str]
    """Object storage ID for this release's cover art"""

    counter: int
    """Sum of the count of the number of plays of each song inside the release"""

    songs: Optional[List[Song]]
    """A list of songs for this release"""

    def __repr__(self):
        release = ''
        for k, v in asdict(self).items():
            release += f'\n\t\t{k}: {v}'
        return release

    def __str__(self):
        release = ''
        for k, v in asdict(self).items():
            release += f'{k}: {v}\n'
        return release
