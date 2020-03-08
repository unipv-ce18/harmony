from bson import ObjectId

from flask_restful import Resource, reqparse


class GetRelease(Resource):
    def __init__(self, db):
        self.db = db

    def get(self, id):
        if not ObjectId.is_valid(id):
            return 'Id not valid', 401

        data = reqparse.RequestParser().add_argument('songs').parse_args()
        include_songs = data['songs'] == '1'
        release = self.db.get_release(id, include_songs)

        if release is None:
            return 'No release', 401
        return release.to_dict(), 200


class GetArtist(Resource):
    def __init__(self, db):
        self.db = db
        
    def get(self, id):
        if not ObjectId.is_valid(id):
            return 'Id not valid', 401

        data = reqparse.RequestParser().add_argument('releases').parse_args()
        include_releases = data['releases'] == '1'
        artist = self.db.get_artist(id, include_releases)

        if artist is None:
            return 'No artist', 401
        return artist.to_dict(), 200
