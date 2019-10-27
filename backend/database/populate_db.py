from os import getcwd
import json

def read_json(path):
    with open(path, 'r') as f:
        data = f.read()
    return json.loads(data)

artists_list = read_json(getcwd() + '/json_data/artists.json')
albums_list = read_json(getcwd() + '/json_data/albums.json')
songs_list = read_json(getcwd() + '/json_data/songs.json')
users_list = read_json(getcwd() +  '/json_data/users.json')
