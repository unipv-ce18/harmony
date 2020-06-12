from common.database import Database, connect_db
from apiserver.config import current_config


db = Database(connect_db(current_config).get_database())

print(db.get_library('5ece9573b16fafc9c3cbd2a4'))
