import datetime
import database
import security


def add_token_to_blacklist(token):
    payload = security.decode_token(token)
    expiration = payload['exp']
    current_time = datetime.datetime.utcnow()
    delta = (expiration - current_time).total_seconds()

    if delta > 0:
        database.blacklist.create_index("date", expireAfterSeconds=delta)
        database.blacklist.insert({
            "token": token,
            "date": datetime.datetime.utcnow()
        })
        return True
    else:
        return False


def check_blacklisted_token(token):
    result = database.blacklist.find({"token": token})
    for res in result:
        return res
