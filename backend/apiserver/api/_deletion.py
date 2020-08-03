from . import db
from common.model import Artist, Release, Song, User
from common.database.contracts import user_contract as c


def delete_song(song: Song):
    db.remove_song_from_playlists(song.id)
    db.remove_song_from_libraries(song.id)
    db.put_content(None, None, 'audio/flac', song.id)   # take advantage of the terminator to remove the song from storage


def delete_release(release: Release):
    db.remove_release_from_libraries(release.id)

    if release.cover is not None:
        db.remove_image_from_playlists(release.cover)
        db.put_content(None, None, 'image/_', release.cover)

    if release.songs:
        for song in release.songs:
            delete_song(song)


def delete_artist(artist: Artist):
    db.remove_artist_from_libraries(artist.id)

    if artist.image is not None:
        db.put_content(None, None, 'image/_', artist.image)

    if artist.releases:
        for r in artist.releases:
            release = db.get_release(r.id, True)
            delete_release(release)


def delete_user(user: User):
    user = user.to_dict()
    if user[c.USER_TYPE] == c.USER_TYPE_CREATOR:
        artists = [artist for artist in db.get_user_artists(user[c.USER_REF_ID])]
        if artists:
            for a in artists:
                artist = db.get_artist(a.id, True)
                delete_artist(artist)

                db.remove_artist(artist.id)

    if user[c.USER_AVATAR_URL] is not None:
        db.put_content(None, None, 'image/_', user[c.USER_AVATAR_URL])
