import pymongo
from common.database import Database
from apiserver.config import current_config


db_client = pymongo.MongoClient(current_config.MONGO_URI,
                                username=current_config.MONGO_USERNAME,
                                password=current_config.MONGO_PASSWORD)
harmony = db_client.get_database()


db = Database(harmony)

#print(db.search('you'))
#print(db.get_artist('5dfd65de57475213eea241b3', include_releases=True).to_dict())
print(db.get_release('5dfd65de57475213eea2415a').to_dict())
#print(db.get_artist_releases('5dfd65de57475213eea241b3'))
