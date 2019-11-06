import pymongo
import utils

client = pymongo.MongoClient(utils.config['database']['url'],
                             username=utils.config['database']['username'],
                             password=utils.config['database']['password'],
                             authSource=utils.config['database']['name'],
                             authMechanism='SCRAM-SHA-1')

harmony = client[utils.config['database']['name']]

artists = harmony['artists']
albums = harmony['albums']
songs = harmony['songs']
users = harmony['users']
blacklist = harmony['blacklist']
