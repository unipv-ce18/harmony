from database import Queries
import utils, pymongo


client = pymongo.MongoClient("mongodb://localhost:27017/harmony",
                             username="",
                             password="")


artists_list = utils.read_json('resources/artists.json')
albums_list = utils.read_json('resources/albums.json')
songs_list = utils.read_json('resources/songs.json')
users_list = utils.read_json('resources/users.json')

queries = Queries(client["harmony"])

queries.add_artists(artists_list)
queries.add_albums(albums_list)
queries.add_songs(songs_list)
queries.add_users(users_list)

print(queries.search_artist('queens of the stone age'))
