import datetime

from bson.objectid import ObjectId

from model import Artist, Release, Song


_ARTIST_PROJECTION = {
    '_id': 0,
    'id': '$_id',
    'name': '$name',
    'image': '$image'
}


_ARTIST_COMPLETE_PROJECTION = {
    '_id': 0,
    'id': '$_id',
    'name': '$name',
    'sort_name': '$sort_name',
    'country': '$country',
    'life_span': '$life_span',
    'genres': '$genres',
    'bio': '$bio',
    'members': '$members',
    'links': '$links',
    'image': '$image'
}


_RELEASE_PROJECTION = {
    '_id': 0,
    'id': '$releases._id',
    'name': '$releases.name',
    'artist': {
        'id': '$_id',
        'name': '$name'
    },
    'date': '$releases.date',
    'type': '$releases.type',
    'cover': '$releases.cover'
}


_SONG_PROJECTION = {
    '_id': 0,
    'id': '$releases.songs._id',
    'title': '$releases.songs.title',
    'artist': {
        'id': '$_id',
        'name': '$name'
    },
    'release': {
        'id': '$releases._id',
        'name': '$releases.name',
        'cover': '$releases.cover'
    },
    'length': '$releases.songs.length',
    'lyrics': '$releases.songs.lyrics',
    'key_id': '$key_id',
    'key': '$key'
}


def _artist_pipeline(match_params):
    return [
        {'$match': match_params},
        {'$project': _ARTIST_PROJECTION}
    ]


def _artist_complete_pipeline(match_params):
    return [
        {'$match': match_params},
        {'$project': _ARTIST_COMPLETE_PROJECTION}
    ]


def _release_pipeline(match_params):
    return [
        {'$unwind': '$releases'},
        {'$match': match_params},
        {'$project': _RELEASE_PROJECTION}
    ]


def _song_pipeline(match_params):
    return [
        {'$unwind': '$releases'},
        {'$match': match_params},
        {'$unwind': '$releases.songs'},
        {'$match': match_params},
        {'$project': _SONG_PROJECTION}
    ]


def objectid_to_str(res):
    for k, v in res.items():
        if k == 'id':
            res[k] = str(res[k])
        if isinstance(v, dict):
            objectid_to_str(res[k])
        if isinstance(v, list):
            for i in range(len(v)):
                if isinstance(v[i], dict):
                    objectid_to_str(v[i])
    return res


def modify_artist(artist):
    if 'releases' in artist:
        artist['releases'] = modify_releases(artist['releases'])
    return artist


def modify_releases(releases):
    release_list = [add_objectid(release) for release in releases]
    for r in release_list:
        if 'songs' in r:
            r['songs'] = modify_songs(r['songs'])
    return release_list


def modify_songs(songs):
    return [add_objectid(song) for song in songs]


def add_objectid(item):
    item['_id'] = ObjectId()
    return item


class Database:
    def __init__(self, db_connection):
        self.artists = db_connection['artists']
        self.users = db_connection['users']
        self.blacklist = db_connection['blacklist']
        self.transcoder = db_connection['transcoder']
        self.transcoder.create_index('exp', expireAfterSeconds=60)

    def add_artist(self, artist):
        x = self.artists.insert_one(modify_artist(artist))
        return x.inserted_id

    def add_artists(self, artists):
        return [self.add_artist(artists[i]) for i in range(len(artists))]

    def check_username(self, username):
        query = {'username': username}
        result = self.users.find_one(query)
        return result

    def check_email(self, email):
        query = {'email': email}
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

    def add_release_to_existing_artist(self, artist_id, release):
        self.artists.update(
            {'_id': ObjectId(artist_id)},
            {'$push': {'releases': {
                '_id': ObjectId(),
                'name': release['name'],
                'date': release['date'],
                'type': release['type'],
                'cover': release['cover'],
                'songs': self.modify_songs(release['songs'])
            } } }
        )

    def search_artist(self, artist):
        query = {'name': {'$regex': f'^{artist}', '$options': '-i'}}
        result = self.artists.aggregate(pipeline=_artist_pipeline(query))
        return [Artist(objectid_to_str(res)) for res in result]

    def search_release(self, release):
        query = {'releases.name': {'$regex': f'^{release}', '$options': '-i'}}
        result = self.artists.aggregate(pipeline=_release_pipeline(query))
        return [Release(objectid_to_str(res)) for res in result]

    def search_song(self, song):
        query = {'releases.songs.title': {'$regex': f'^{song}', '$options': '-i'}}
        result = self.artists.aggregate(pipeline=_song_pipeline(query))
        return [Song(objectid_to_str(res)) for res in result]

    def search(self, item):
        return {
            'artists': self.search_artist(item),
            'releases': self.search_release(item),
            'songs': self.search_song(item)
        }

    def search_user(self, id):
        query = {'_id': ObjectId(id)}
        result = self.users.find_one(query, {'_id': 0})
        return result

    def get_artist_releases(self, id):
        query = {'_id': ObjectId(id)}
        result = self.artists.aggregate(pipeline=_release_pipeline(query))
        return [Release(objectid_to_str(res)) for res in result]

    def get_release_songs(self, id):
        query = {'releases._id': ObjectId(id)}
        result = self.artists.aggregate(pipeline=_song_pipeline(query))
        return [Song(objectid_to_str(res)) for res in result]

    def get_artist(self, id):
        query = {'_id': ObjectId(id)}
        result = self.artists.aggregate(pipeline=_artist_complete_pipeline(query))
        result2 =  self.artists.aggregate(pipeline=_release_pipeline(query))
        res = []
        for r in result:
            r['releases'] = [r2 for r2 in result2]
            res.append(r)
        return Artist(objectid_to_str(res[0]))

    def get_release(self, id):
        query = {'releases._id': ObjectId(id)}
        result = self.artists.aggregate(pipeline=_release_pipeline(query))
        return [Release(objectid_to_str(res)) for res in result][0]

    def get_song(self, id):
        query = {'releases.songs._id': ObjectId(id)}
        result = self.artists.aggregate(pipeline=_song_pipeline(query))
        return [Song(objectid_to_str(res)) for res in result][0]

    # to fix, it updates all the songs
    def update_song_transcoding_info(self, id, key_id, key):
        query = {'releases.songs._id': ObjectId(id)}
        self.artists.update_one(
            query,
            {'$set': {
                'key_id': key_id,
                'key': key
            } }
        )

    def delete_artist(self, id):
        query = {'_id': ObjectId(id)}
        self.artists.remove(query)

    def store_token(self, token):
        _my_token = {
            'jti': token['jti'],
            'user_identity': token['identity'],
            'type': token['type'],
            'exp': token['exp'],
            'revoked': False
        }
        return self.blacklist.insert_one(_my_token)

    def revoke_token(self, token_id):
        self.blacklist.update_one({'jti': token_id}, {'$set': {'revoked': True}})

    def is_token_revoked(self, token):
        _tok = self.blacklist.find_one({'jti': token['jti']})
        return True if _tok is None else _tok['revoked']

    def store_song_id(self, id):
        current_time = datetime.datetime.utcnow()
        self.transcoder.insert_one({
            '_id': ObjectId(id),
            'exp': current_time
        })

    def remove_song_id(self, id):
        self.transcoder.delete_one({
            '_id': ObjectId(id)
        })

    def song_in_transcoding(self, id):
        query = {'_id': ObjectId(id)}
        result = self.transcoder.find_one(query)
        return bool(result)

    def drop_artists_collection(self):
        self.artists.drop()

    def drop_users_collection(self):
        self.users.drop()

    def drop_transcoder_collection(self):
        self.transcoder.drop()
