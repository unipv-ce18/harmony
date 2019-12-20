import pymongo
from transcoder import Orchestrator
from config import current_config


db_client = pymongo.MongoClient(current_config.MONGO_URI,
                                username=current_config.MONGO_USERNAME,
                                password=current_config.MONGO_PASSWORD)
harmony = db_client.get_database()


orchestrator = Orchestrator(harmony)

if __name__ == '__main__':
    orchestrator.run()
