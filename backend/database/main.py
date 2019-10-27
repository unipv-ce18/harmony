from populate_db import artists_list, albums_list, songs_list, users_list
from harmony_db import *
import query

if __name__ == '__main__':
    add_artists(artists_list)
    add_albums(albums_list)
    add_songs(songs_list)
    add_users(users_list)

    print(query.search_artist('queens of the stone age'))
