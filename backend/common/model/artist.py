from dataclasses import dataclass, asdict
from typing import Optional, List

from .release import Release


@dataclass
class Artist:

    id: Optional[str]
    """This artist's database ID or `None`"""

    creator: Optional[str]
    """The ID of the user that created this artist or `None` if created server side (using "hyadm")"""

    name: str
    """The name of this artist"""

    sort_name: str
    """This artist's sort name (e.g. "Cranberries, The")"""

    country: str
    """ISO 3166 code of the country of origin (e.g. `US` or `DE`)"""

    life_span: dict
    """This artist's life span, contains `begin` and `end`"""

    genres: List[str]
    """A list of genres for this artist"""

    bio: str
    """The artist's biography document"""

    members: dict
    """Members and roles for this artist"""

    links: List[dict]
    """Web page URL and social links"""

    image: Optional[str]
    """Object storage ID for an image of this artist"""

    releases: Optional[List[Release]]
    """Releases for this artist"""

    def __repr__(self):
        artist = ''
        for k, v in asdict(self).items():
            artist += f'\n\t{k}: {v}'
        return artist

    def __str__(self):
        artist = ''
        for k, v in asdict(self).items():
            artist += f'{k}: {v}\n'
        return artist
