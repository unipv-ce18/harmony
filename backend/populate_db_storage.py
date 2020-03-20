from apiserver.config import current_config
from common.database import Database, connect_db
from common.database.codec import artist_from_document
from common.storage import Storage, connect_storage
from tests.db_test_utils import read_json


db = Database(connect_db(current_config).get_database())
st = Storage(connect_storage(current_config))

artists_list = read_json('tests/resources/test_artists.json')
users_list = read_json('tests/resources/test_users.json')

db.artists.drop()
db.users.drop()
st.delete_all_files(current_config.STORAGE_BUCKET_REFERENCE)
st.delete_all_files(current_config.STORAGE_BUCKET_TRANSCODED)

full_artist = artist_from_document(artists_list[0])
artist_id = db.put_artist(full_artist)

for rel in full_artist.releases:
    release_id = db.put_release(artist_id, rel)

    for song in rel.songs:
        song_id = db.put_song(release_id, song)
        st.minio_client.fput_object(current_config.STORAGE_BUCKET_REFERENCE,
                                 f'{song_id}.flac', f'lossless_songs/{song.title}.flac')


db.add_users(users_list)
