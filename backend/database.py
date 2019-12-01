from bson.objectid import ObjectId


class Database:
    def __init__(self, db_connection):
        self.artists = db_connection['artists']
        self.users = db_connection['users']
        self.blacklist = db_connection['blacklist']

    def store_token(self, token):
        _my_token = {
            "jti": token["jti"],
            "user_identity": token["identity"],
            "type": token["type"],
            "exp": token["exp"],
            "revoked": False
        }
        return self.blacklist.insert_one(_my_token)

    def revoke_token(self, token_id):
        self.blacklist.update_one({"jti": token_id}, {"$set": {"revoked": True}})

    def is_token_revoked(self, token):
        _tok = self.blacklist.find_one({"jti": token["jti"]})
        return True if _tok is None else _tok["revoked"]

    def add_artist(self, a):
        self.artists.insert_one(a)

    def add_artists(self, a):
        if self.artists.count() != 0:
            for i in range(len(a)):
                self.add_artist(a[i])
        else:
            self.artists.insert_many(a)

    def check_username(self, username):
        query = {"username": username}
        result = self.users.find_one(query)
        return result

    def check_email(self, email):
        query = {"email": email}
        result = self.users.find_one(query)
        return result

    def add_user(self, u):
        if self.check_username(u['username']) is None:
            if self.check_email(u['email']) is None:
                return self.users.insert_one(u)
        return False

    def add_users(self, u):
        if self.users.count() != 0:
            for i in range(len(u)):
                self.add_user(u[i])
        else:
            self.users.insert_many(u)

    def search_artist(self, artist):
        query = {"name": {"$regex": f'^{artist}', "$options": "-i"}}
        result = self.artists.find(query, {"genres": 0, "description": 0, "albums": 0})
        artists_list = [res for res in result]
        for i in range(len(artists_list)):
            artists_list[i]['_id'] = str(artists_list[i]['_id'])
        return artists_list

    def search_album(self, album):
        query = {"albums.name": {"$regex": f'^{album}', "$options": "-i"}}
        pipeline = [
            {'$unwind': '$albums'},
            {'$match': query},
            {'$project': {
                'name': '$albums.name',
                'year': '$albums.year',
                'cover': '$albums.cover'
            } }
        ]
        result = self.artists.aggregate(pipeline=pipeline)
        albums_list = [res for res in result]
        for i in range(len(albums_list)):
            albums_list[i]['_id'] = str(albums_list[i]['_id'])
        return albums_list

    # to fix
    def search_song(self, song):
        query = {"albums.songs.title": {"$regex": f'^{song}', "$options": "-i"}}
        pipeline = [
            {'$unwind': '$albums'},
            {'$match': query},
            {'$project': {
                'title': '$albums.songs.title',
                'artist': '$albums.songs.artist',
                'album': '$albums.songs.album',
                'length': '$albums.songs.length'
            } }
        ]
        result = self.artists.aggregate(pipeline=pipeline)
        songs_list = [res for res in result]
        for i in range(len(songs_list)):
            songs_list[i]['_id'] = str(songs_list[i]['_id'])
        return songs_list

    def search_user(self, id):
        query = {"_id": ObjectId(id)}
        result = self.users.find_one(query, {"_id": 0})
        return result

    def get_artist_albums(self, id):
        query = {"_id": ObjectId(id)}
        artist = self.artists.find_one(query, {"_id": 0, "name": 0, "genres": 0, "description": 0, "image": 0,
                                               "albums.artist": 0, "albums.songs": 0})
        return artist

    def get_album_songs(self, artist, album):
        pass

    def search(self, item):
        return {
            'artist': self.search_artist(item),
            'album': self.search_album(item),
            'song': self.search_song(item)
        }

    def get_complete_artist(self, id):
        query = {"_id": ObjectId(id)}
        artist = self.artists.find_one(query, {"_id": 0})
        return artist

    def get_song_from_id(self, id):
        pass

    def get_blacklist(self):
        return self.blacklist

    def drop_artists_collection(self):
        self.artists.drop()
