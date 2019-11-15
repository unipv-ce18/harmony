import pymongo
from pprint import pprint
from database import Database
from transcoder import Transcoder
import utils

client = pymongo.MongoClient(utils.config['database']['url'],
                             username=utils.config['database']['username'],
                             password=utils.config['database']['password'],
                             authSource=utils.config['database']['name'],
                             authMechanism='SCRAM-SHA-1')

harmony = client[utils.config['database']['name']]
db = Database(harmony)

artists_list = utils.read_json('resources/artists.json')
users_list = utils.read_json('resources/users.json')

db.drop_artists_collection()

db.add_artists(artists_list)

pprint(db.search('queens'))
#pprint(db.get_complete_artist('5dcde7a752b971e9950f95e4'))
#pprint(db.search_song('leg'))
#pprint(db.get_artist_albums('5dcdf078cace0a7137a88687'))

#id_list = [
#    '5dbac87a0f70f40bc954c04a',
#    '5dbac87a0f70f40bc954c04b',
#    '5dbac87a0f70f40bc954c04c'
#]

#transcoder = Transcoder(harmony)
#transcoder.transcoding_songs(id_list, bitrate='96k')
