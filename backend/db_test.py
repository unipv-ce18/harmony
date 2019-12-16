import pymongo
from common.database import Database
from config import current_config


db_client = pymongo.MongoClient(current_config.MONGO_URI,
                                username=current_config.MONGO_USERNAME,
                                password=current_config.MONGO_PASSWORD)
harmony = db_client.get_database()


db = Database(harmony)

print(db.search('you'))
#print(db.get_artist('5de5193278839c3c6c840681'))
#print(db.get_release('5de5193278839c3c6c840623'))
#print(db.get_artist_releases('5de5193278839c3c6c840681'))
