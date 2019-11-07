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

    def add_user(self, user):
        res = self.db.users.find_one({"username": {"$regex": user["username"], "$options": "-i"}})
        return self.db.users.insert_one(user) if res is None else False

    def search_artist(self, artist):
        query = {"name": {"$regex": artist, "$options": "-i"}}
        result = self.db.artists.find_one(query)
        return result

    def search_album(self, album):
        query = {"name": {"$regex": album, "$options": "-i"}}
        result = self.db.albums.find_one(query)
        return result

    def search_song(self, song):
        query = {"title": {"$regex": song, "$options": "-i"}}
        result = self.db.songs.find_one(query)
        return result

    def search_user(self, username):
        query = {"username": {"$regex": username, "$options": "-i"}}
        result = self.db.users.find_one(query)
        return result
