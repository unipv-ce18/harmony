from common.database import Database, connect_db
from apiserver.config import current_config


db = Database(connect_db(current_config).get_database())

print(db.get_library('5e7b820de71100db28f5e66e'))
