from harmony_db import artists, albums, songs, users

def search_artist(artist):
    query = { "name": { "$regex" : artist, "$options" : "-i" } }
    result = artists.find(query)
    return [res for res in result]

def search_album(album):
    query = { "name": { "$regex" : album, "$options" : "-i" } }
    result = albums.find(query)
    return [res for res in result]

def search_song(song):
    query = { "title": { "$regex" : song, "$options" : "-i" } }
    result = songs.find(query)
    return [res for res in result]

def search_user(user):
    query = { "username": { "$regex" : user, "$options" : "-i" } }
    result = users.find(query)
    return [res for res in result]
