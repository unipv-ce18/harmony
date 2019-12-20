import os

import pymongo

from apiserver.config import current_config
from common.database import Database
from storage import Storage, minio_client
from tests.db_test_utils import read_json


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

db = Database(harmony)
st = Storage(minio_client)

artists_list = read_json('tests/resources/test_artists.json')
users_list = read_json('tests/resources/test_users.json')

db.artists.drop()
db.users.drop()
st.delete_all_files('lossless-songs')
st.delete_all_files('compressed-songs')

ids = db.add_artists(artists_list)
db.add_users(users_list)

rename_songs_with_id(ids[0])
for file in os.listdir('lossless_songs'):
    st.upload_file('lossless-songs', file, 'lossless_songs')
