from bson.objectid import ObjectId

class Queries:
    def __init__(self, database):
        self.db = database
        self.db.artists = database['artists']
        self.db.albums = database['albums']
        self.db.songs = database['songs']
        self.db.users = database['users']
        self.db.blacklist = database['blacklist']

    def add_artist(self, a):
        for artist in self.db.artists.find():
            if artist['name'].lower() == a['name'].lower():
                return
        self.db.artists.insert_one(a)

    def add_artists(self, a):
        if self.db.artists.count() != 0:
            for i in range(len(a)):
                self.add_artist(a[i])
        else:
            self.db.artists.insert_many(a)

    def add_album(self, a):
        for album in self.db.albums.find():
            if album['name'].lower() == a['name'].lower() and album['artist'].lower() == a['artist'].lower():
                return
        self.db.albums.insert_one(a)

    def add_albums(self, a):
        if self.db.albums.count() != 0:
            for i in range(len(a)):
                self.add_album(a[i])
        else:
            self.db.albums.insert_many(a)

    def add_song(self, s):
        for song in self.db.songs.find():
            if song['title'].lower() == s['title'].lower() and song['album'].lower() == s['album'].lower():
                return
        self.db.songs.insert_one(s)

    def add_songs(self, s):
        if self.db.songs.count() != 0:
            for i in range(len(s)):
                self.add_song(s[i])
        else:
            self.db.songs.insert_many(s)

    def add_user_2v(self, u):
        for user in self.db.users.find():
            if user['username'] == u['username'] or user['email'] == u['email']:
                return
            self.db.users.insert_one(u)

    def add_users(self, u):
        if self.db.users.count() != 0:
            for i in range(len(u)):
                self.add_user_2v(u[i])
        else:
            self.db.users.insert_many(u)

    def add_user(self, user):
        res = self.db.users.find_one({"username": {"$regex": user["username"], "$options": "-i"}})
        return self.db.users.insert_one(user) if res is None else False

    def search_artist(self, artist):
        query = {"name": {"$regex": f'^{artist}', "$options": "-i"}}
        result = self.db.artists.find(query, {"genres": 0, "description": 0})
        return [res for res in result]

    def search_album(self, album):
        query = {"name": {"$regex": f'^{album}', "$options": "-i"}}
        result = self.db.albums.find(query)
        return [res for res in result]

    def search_song(self, song):
        query = {"title": {"$regex": f'^{song}', "$options": "-i"}}
        result = self.db.songs.find(query)
        return [res for res in result]

    def search_user(self, user):
        query = {"username": user}
        result = self.db.users.find_one(query)
        return result

    def get_artist_albums(self, artist):
        query = {"artist": artist}
        result = self.db.albums.find(query, {"artist": 0})
        return [res for res in result]

    def get_album_songs(self, artist, album):
        query = {"artist": artist, "album": album}
        result = self.db.songs.find(query, {"album": 0, "link": 0})
        return [res for res in result]

    def search(self, item):
        art = self.search_artist(item)
        alb = self.search_album(item)
        s = self.search_song(item)
        result = {
            "artist": art,
            "album": alb,
            "song": s
        }
        return result

    def get_complete_artist(self, id):
        query = {"_id": ObjectId(id)}
        result = self.db.artists.find(query)
        artist = [res for res in result]
        try:
            artist_name = artist[0]['name']
            albums = self.get_artist_albums(artist_name)
            complete_artist = {
                "name": artist_name,
                "genres": artist[0]['genres'],
                "description": artist[0]['description'],
                "image": artist[0]['image'],
                "album": albums
            }
            return complete_artist
        except:
            return False

    def get_song_from_id(self, id):
        query = {"_id": ObjectId(id)}
        result = self.db.songs.find_one(query)
        return result
