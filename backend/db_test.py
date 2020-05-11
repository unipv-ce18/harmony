from common.database import Database, connect_db
from apiserver.config import current_config


db = Database(connect_db(current_config).get_database())

print(db.update_prefs_library('5e7b820de71100db28f5e66e', 'artists', '5dfd65de57475213eea241b3'))
print(db.get_library('5e7b820de71100db28f5e66e'))
