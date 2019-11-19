import datetime

from backend import security
from .database import Database


class Blacklist:
    def __init__(self, db_connection):
        self.db = Database(db_connection)
        self.blacklist = self.db.get_blacklist()

    def add_token_to_blacklist(self, token):
        payload = security.decode_token(token)
        if isinstance(payload, list):
            expiration = payload['exp']
            current_time = datetime.datetime.utcnow()
            delta = (expiration - current_time).total_seconds()

            if delta > 0:
                blacklist.create_index("date", expireAfterSeconds=delta)
                blacklist.insert({
                    "token": token,
                    "date": current_time
                })
                return True
        return False

    def check_blacklisted_token(self, token):
        result = self.blacklist.find_one({"token": token})
        return bool(result)
