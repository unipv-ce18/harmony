import os
import pymongo
from minio import Minio
from database.database import Database
from transcoder.transcoder import Transcoder
from model.artist import Artist
from model.release import Release
from model.song import Song
from storage.storage import Storage
import utils
from config import current_config
from transcoder.config import config_storage


def rename_songs_with_id(artist_id):
    a = db.get_artist_releases(artist_id)
    b = []
    for i in range(len(a)):
        a[i] = a[i].get_release_as_dict()
        b.append(db.get_release_songs(a[i]['id']))
    c = {}
    for i in range(len(b)):
        for j in range(len(b[i])):
            b[i][j] = b[i][j].get_song_as_dict()
            c[b[i][j]['title']] = b[i][j]['id']
    for f in os.listdir('lossless_songs'):
        for k, v in c.items():
            if k == f.replace('.flac', ''):
                os.rename(f'lossless_songs/{f}', f'lossless_songs/{v}.flac')


db_client = pymongo.MongoClient(current_config.MONGO_URI,
                             username=current_config.MONGO_USERNAME,
                             password=current_config.MONGO_PASSWORD)
harmony = db_client.get_database()

minio_client = Minio(config_storage['Endpoint'],
                     access_key=config_storage['AccessKey'],
                     secret_key=config_storage['SecretKey'],
                     secure=config_storage['TLS'])


db = Database(harmony)
st = Storage(minio_client)
transcoder = Transcoder(harmony, minio_client)

NEW = False
if NEW:
    artists_list = utils.read_json('resources/artists.json')
    users_list = utils.read_json('resources/users.json')

    db.drop_artists_collection()
    db.drop_users_collection()
    st.delete_all_files('lossless-songs')
    st.delete_all_files('compressed-songs')
    st.delete_all_files('manifest-files')
    st.delete_all_files('init-segments')

    ids = db.add_artists(artists_list)
    db.add_users(users_list)

    rename_songs_with_id(ids[0])
    for file in os.listdir('lossless_songs'):
        st.upload_file('lossless-songs', file, 'lossless_songs')

#print(db.search('avon'))
#print(db.get_artist('5de3d93ae5d04b5bd5330397'))
#print(db.get_release('5de3d93ae5d04b5bd5330339'))
#print(db.get_artist_releases('5de3d93ae5d04b5bd5330397'))
#print(db.get_release_songs('5de3d93ae5d04b5bd5330339'))

transcoder.complete_transcode('5de3e829f1336219d87a27be')
print(db.get_song('5de3e829f1336219d87a27be'))
