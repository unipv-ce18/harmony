import pymongo

import utils

client = pymongo.MongoClient(utils.config['database']['url'], username='', password='')

harmony_db = client[utils.config['database']['name']]

artists = harmony_db['artists']
albums = harmony_db['albums']
songs = harmony_db['songs']

users = harmony_db['users']

#----------------------------------add section---------------------------------#

def add_artist(a):
    for artist in artists.find():
        if artist['name'].lower() == a['name'].lower():
            return
    _ = artists.insert_one(a)

def add_artists(a):
    if artists.count() != 0:
        for i in range(len(a)):
            add_artist(a[i])
    else:
        _ = artists.insert_many(a)

def add_album(a):
    for album in albums.find():
        if album['name'].lower() == a['name'].lower() and album['artist'].lower() == a['artist'].lower():
            return
    _ = albums.insert_one(a)

def add_albums(a):
    if albums.count() != 0:
        for i in range(len(a)):
            add_album(a[i])
    else:
        _ = albums.insert_many(a)

def add_song(s):
    for song in songs.find():
        if song['title'].lower() == s['title'].lower() and song['album'].lower() == s['album'].lower():
            return
    _ = songs.insert_one(s)

def add_songs(s):
    if songs.count() != 0:
        for i in range(len(s)):
            add_song(s[i])
    else:
        _ = songs.insert_many(s)

def add_user(u):
    for user in users.find():
        if user['username'].lower() == u['username'].lower() or user['email'].lower() == u['email'].lower():
            return
    _ = users.insert_one(u)

def add_users(u):
    if users.count() != 0:
        for i in range(len(u)):
            add_user(u[i])
    else:
        _ = users.insert_many(u)
