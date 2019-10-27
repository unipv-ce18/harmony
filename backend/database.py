import pymongo
import utils, security

client = pymongo.MongoClient(utils.config["database"]["url"], username="", password="")


def make_database():
    if utils.config["database"]["name"] in client.list_database_names():
        return "database already there!"
    else:
        harmony = client[utils.config["database"]["name"]]
        users = harmony["users"]
        user = {
            "username": "john doe",
            "email": "harmony_test@gmail.com",
            "password": security.hash_password("pomodoro"),
            "api-key": "spaghetti"
        }
        record = harmony.users.insert(user)
        return harmony
