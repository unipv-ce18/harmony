import datetime
from database import Queries
import security

class Blacklist:
    def __init__(self, database):
        self.query = Queries(database)
        self.blacklist = self.query.get_blacklist()

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
        return False

    def check_blacklisted_token(self, token):
        result = self.blacklist.find_one({"token": token})
        return bool(result)
