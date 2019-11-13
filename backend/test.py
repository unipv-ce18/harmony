import json, pymongo
from pprint import pprint
from database import Queries
from transcoder import Transcoder
import utils

client = pymongo.MongoClient(utils.config['database']['url'],
                             username=utils.config['database']['username'],
                             password=utils.config['database']['password'],
                             authSource=utils.config['database']['name'],
                             authMechanism='SCRAM-SHA-1')

harmony = client[utils.config['database']['name']]
query = Queries(harmony)

artists_list = utils.read_json('resources/artists.json')
albums_list = utils.read_json('resources/albums.json')
songs_list = utils.read_json('resources/songs.json')
users_list = utils.read_json('resources/users.json')

query.add_artists(artists_list)
query.add_albums(albums_list)
query.add_songs(songs_list)
query.add_users(users_list)

#pprint(search_artist('queens'))
#pprint(get_artist_albums('Queens of the Stone Age'))
pprint(query.get_album_songs('Queens of the Stone Age', 'Queens of the Stone Age'))
#pprint(get_complete_artist('5dbac87a0f70f40bc954c042'))
#pprint(search('queens'))

id_list = [
    '5dbac87a0f70f40bc954c04a',
    '5dbac87a0f70f40bc954c04b',
    '5dbac87a0f70f40bc954c04c'
]

transcoder = Transcoder(harmony)
transcoder.transcoding_songs(id_list, bitrate='96k')
