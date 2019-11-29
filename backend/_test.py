import pymongo
from database.database import Database
from transcoder import Transcoder
from model.artist import Artist
from model.release import Release
from model.song import Song
import utils
from config import current_config

client = pymongo.MongoClient(current_config.MONGO_URI,
                             username=current_config.MONGO_USERNAME,
                             password=current_config.MONGO_PASSWORD)

harmony = client[current_config.MONGO_DBNAME]
db = Database(harmony)

artists_list = utils.read_json('resources/artists.json')
users_list = utils.read_json('resources/users.json')

#db.drop_artists_collection()
#db.drop_users_collection()

#db.add_artists(artists_list)
#db.add_users(users_list)

print(db.search('avon'))
#print(db.get_artist('5ddd1ca32af898b100e7ce6d'))
#print(db.get_release('5ddd1ca32af898b100e7ce10'))
#print(db.get_artist_releases('5ddd1ca32af898b100e7ce6d'))
#print(db.get_release_songs('5ddd1ca32af898b100e7ce0f'))

id_list = [
    '5ddd1ca32af898b100e7ce17'
]

transcoder = Transcoder(harmony)
#transcoder.transcoding_songs(id_list, bitrate='96k')
