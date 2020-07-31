// User indexes
db.users.createIndex({'username': 1});
db.users.createIndex({'email': 1});

// Artist indexes
db.artists.createIndex({'name': 1});
db.artists.createIndex({'releases._id': 1});
db.artists.createIndex({'releases.name': 1});
db.artists.createIndex({'releases.songs._id': 1});
db.artists.createIndex({'releases.songs.title': 1});

// Blacklist TTL index
db.blacklist.createIndex({'exp': 1}, {expireAfterSeconds: 86400})

// Transcoder TTL index
db.transcoder.createIndex({'exp': 1}, {expireAfterSeconds: 60})

// Song alteration jobs TTL
db.modified.createIndex({'exp': 1}, {expireAfterSeconds: 180})

// Song analysis jobs TTL
db.analyzer.createIndex({'exp': 1}, {expireAfterSeconds: 180})
