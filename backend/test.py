import pymongo
from minio import Minio
from database.database import Database
from transcoder.transcoder import Transcoder
from model.artist import Artist
from model.release import Release
from model.song import Song
from storage.storage import Storage
import utils


db_client = pymongo.MongoClient(utils.config['MONGO_URI'],
                                username=utils.config['MONGO_USERNAME'],
                                password=utils.config['MONGO_PASSWORD'])
harmony = db_client[utils.config['MONGO_NAME']]

minio_client = Minio(utils.config_storage['Endpoint'],
                     access_key=utils.config_storage['AccessKey'],
                     secret_key=utils.config_storage['SecretKey'],
                     secure=utils.config_storage['TLS'])


db = Database(harmony)
st = Storage(minio_client)
transcoder = Transcoder(harmony, minio_client)

artists_list = utils.read_json('resources/artists.json')
users_list = utils.read_json('resources/users.json')

#db.drop_artists_collection()
#db.drop_users_collection()

#db.add_artists(artists_list)
#db.add_users(users_list)

#print(db.search('avon'))
#print(db.get_artist('5ddd1ca32af898b100e7ce6d'))
#print(db.get_release('5ddd1ca32af898b100e7ce10'))
#print(db.get_artist_releases('5ddd1ca32af898b100e7ce6d'))
#print(db.get_release_songs('5ddd1ca32af898b100e7ce0f'))

id = '5ddd1ca32af898b100e7ce17'

st.upload_file('lossless-songs', f'{id}.flac', 'lossless_songs')

transcoder.complete_transcode(id)
