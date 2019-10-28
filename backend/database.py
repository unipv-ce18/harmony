import pymongo
import utils

client = pymongo.MongoClient(utils.config['database']['url'],
                             username='',
                             password='')

harmony = client[utils.config['database']['name']]

artists = harmony['artists']
albums = harmony['albums']
songs = harmony['songs']
users = harmony['users']


def add_artist(a):
    for artist in artists.find():
        if artist['name'].lower() == a['name'].lower():
            return
    artists.insert_one(a)


def add_artists(a):
    if artists.count() != 0:
        for i in range(len(a)):
            add_artist(a[i])
    else:
        artists.insert_many(a)


def add_album(a):
    for album in albums.find():
        if album['name'].lower() == a['name'].lower() and album['artist'].lower() == a['artist'].lower():
            return
    albums.insert_one(a)


def add_albums(a):
    if albums.count() != 0:
        for i in range(len(a)):
            add_album(a[i])
    else:
        albums.insert_many(a)


def add_song(s):
    for song in songs.find():
        if song['title'].lower() == s['title'].lower() and song['album'].lower() == s['album'].lower():
            return
    songs.insert_one(s)


def add_songs(s):
    if songs.count() != 0:
        for i in range(len(s)):
            add_song(s[i])
    else:
        songs.insert_many(s)


def add_user(u):
    for user in users.find():
        if user['username'].lower() == u['username'].lower() or user['email'].lower() == u['email'].lower():
            return
    users.insert_one(u)


def add_users(u):
    if users.count() != 0:
        for i in range(len(u)):
            add_user(u[i])
    else:
        users.insert_many(u)


def search_artist(artist):
    query = {"name": {"$regex": artist, "$options": "-i"}}
    result = artists.find(query)
    return [res for res in result]


def search_album(album):
    query = {"name": {"$regex": album, "$options": "-i"}}
    result = albums.find(query)
    return [res for res in result]


def search_song(song):
    query = {"title": {"$regex": song, "$options": "-i"}}
    result = songs.find(query)
    return [res for res in result]


def search_user(user):
    query = {"username": {"$regex": user, "$options": "-i"}}
    result = users.find(query)
    return [res for res in result]
