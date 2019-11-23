#!/bin/bash

# use: bash config.sh path/to/config.json path/to/requirements.txt

function readJson {
	VALUE=`grep -m 1 "\"${2}\"" ${1} | sed '-r' 's/^ *//;s/.*: *"//;s/",?// '`

	if [ ! "$VALUE" ]; then
		echo "Error: cannot find \"${2}\" in ${1}" >&2;
		exit 1;
	else
		echo $VALUE;
	fi;
}

sed -i 's/\r$//' $1

DATABASE=`readJson $1 MONGO_NAME` || exit 1;
URI=`readJson $1 MONGO_URI` || exit 1;
USER=`readJson $1 MONGO_USERNAME` || exit 1;
PASSWORD=`readJson $1 MONGO_PASSWORD` || exit 1;

sudo add-apt-repository universe
sudo apt update && sudo apt upgrade -y
sudo apt install mongodb
sudo apt install ffmpeg

pip install -r $2

mongo $URI <<EOF
use $DATABASE
db.createUser(
	{
		user: '$USER',
		pwd: '$PASSWORD',
		roles: [ { role: "readWrite", db: '$DATABASE' } ]
	}
)
db.users.createIndex(
	{
		'username': 1,
		'email': 1
	}
)
db.artists.createIndex(
	{
		'name': 1,
		'releases._id': 1,
		'releases.name': 1,
		'releases.songs._id': 1,
		'releases.songs.title': 1
	}
)
exit
EOF

sudo systemctl restart mongodb
sudo apt autoremove
