from database import artists, albums, songs, users
from bson.objectid import ObjectId

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

def check_user_exist(u):
    for user in users.find():
        if user['username'].lower() == u['username'].lower() or user['email'].lower() == u['email'].lower():
            return True
    return False

def add_user(u):
    if not check_user_exist(u):
        users.insert_one(u)

def add_users(u):
    if users.count() != 0:
        for i in range(len(u)):
            add_user(u[i])
    else:
        users.insert_many(u)

def search_artist(artist):
    query = {"name": {"$regex": f'^{artist}', "$options": "-i"}}
    result = artists.find(query, {"genres": 0, "description": 0})
    return [res for res in result]

def search_album(album):
    query = {"name": {"$regex": f'^{album}', "$options": "-i"}}
    result = albums.find(query)
    return [res for res in result]

def search_song(song):
    query = {"title": {"$regex": f'^{song}', "$options": "-i"}}
    result = songs.find(query)
    return [res for res in result]

def search_user(user):
    query = {"username": user}
    result = users.find(query)
    return [res for res in result]

def get_artist_albums(artist):
    query = {"artist": artist}
    result = albums.find(query, {"artist": 0})
    return [res for res in result]

def get_album_songs(artist, album):
    query = {"artist": artist, "album": album}
    result = songs.find(query, {"album": 0, "link": 0})
    return [res for res in result]

def search(item):
    art = search_artist(item)
    alb = search_album(item)
    s = search_song(item)
    result = {
        "artist": art,
        "album": alb,
        "song": s
    }
    return result

def get_complete_artist(id):
    query = {"_id": ObjectId(id)}
    result = artists.find(query)
    artist = [res for res in result]
    try:
        artist_name = artist[0]['name']
        albums = get_artist_albums(artist_name)
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

def get_song_from_id(id):
    query = {"_id": ObjectId(id)}
    result = songs.find(query)
    song = [res for res in result]
    return song[0]
