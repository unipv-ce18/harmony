from common.database import Database, connect_db
from apiserver.config import current_config


db = Database(connect_db(current_config).get_database())

#print(db.search('you'))
#print(db.get_artist('5dfd65de57475213eea241b3', include_releases=True).to_dict())
#print(db.get_release('5dfd65de57475213eea2415a').to_dict())
#print(db.get_artist_releases('5dfd65de57475213eea241b3'))
print(db.get_song_representation_data('5dfd65de57475213eea24164'))
