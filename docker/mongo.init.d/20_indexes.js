// User indexes
db.users.createIndex({'username': 1});
db.users.createIndex({'email': 1});

// Artist indexes
db.artists.createIndex({'name': 1});
db.artists.createIndex({'releases._id': 1});
db.artists.createIndex({'releases.name': 1});
db.artists.createIndex({'releases.songs._id': 1});
db.artists.createIndex({'releases.songs.title': 1});
