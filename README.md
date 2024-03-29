<p align="center">
  <img alt="Harmony" width="400"
       src="https://raw.githubusercontent.com/unipv-ce18/harmony/master/webapp/src/assets/logo-dark.svg"/>
  <br>
  <em>A questionable Music Library made by questionable engineers...</em>
  <br><br>
  <a href="https://github.com/unipv-ce18/harmony/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/unipv-ce18/harmony">
  </a>
  <a href="https://circleci.com/gh/unipv-ce18/harmony">
    <img alt="CircleCI" src="https://img.shields.io/circleci/build/github/unipv-ce18/harmony"/>
  </a>
  <a href="https://codeclimate.com/github/unipv-ce18/harmony">
    <img alt="Code Climate maintainability" src="https://img.shields.io/codeclimate/maintainability/unipv-ce18/harmony">
  </a>
</p>

## Spin it up

### Backend
 
#### With Docker

- Install [Docker](https://www.docker.com/) and [Docker Compose](https://github.com/docker/compose/releases/latest);
- Go inside the `docker` directory and run `./make_worker_image.sh` (or `make_worker_image.cmd` on Windows) to
  create the _transcoder_ microservice image.
  
Now, each time you want to start the backend, run:

```console
# docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

To stop it (add `-v` at the end to also remove all the data):

```console
# docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

> Inside an IntelliJ IDE, you can also use the "Docker dev stack" run configuration

##### Backend services are now available at the following locations:

| Where                   | What                                                         |
|-------------------------|--------------------------------------------------------------|
| http://localhost/       | Service API and API Explorer                                 |
| http://localhost:1234/  | MongoDB Admin                                                |
| http://localhost:9000/  | Minio Web interface, credentials in `docker-compose.dev.yml` |
| http://localhost:15672/ | RabbitMQ management, credentials `guest:guest`               |

You can also access MongoDB with an alternative client at `localhost:27017` and load the OpenAPI specification at
http://localhost/api/v1/spec in your REST client of choice.

> If you are using Docker for Windows with the WSL 2 backend there is a
> [known issue](https://github.com/docker/for-win/issues/3171) with Windows HNS reserving random ports on start and
> preventing the services from booting properly.
>
> Run `netsh int ipv4 set dynamic tcp start=49152 num=1638` for saner defaults or
> `reg add HKLM\SYSTEM\CurrentControlSet\Services\hns\State /v EnableExcludedPortRange /d 0 /f` for disabling port
> reservation completely.

#### Using Python directly

You need to run your own instances of MinIO, RabbitMQ and MongoDB. Look at `docker/rabbitmq/definitions.json` and
`docker/mongo.init.d/` for definitions and scripts to kickstart your environment.

##### MinIO guide.

Get MinIO:
```console
$ wget https://dl.min.io/server/minio/release/linux-amd64/minio
$ chmod +x minio
```

Get mc:
```console
$ wget https://dl.min.io/client/mc/release/linux-amd64/mc
$ chmod +x mc
```

Configure client:
```console
$ ./mc config host add minio http://127.0.0.1 HVTH67YJMJ3BVSHPWJOM kAeWXU3qV5vyofP3kTnyEmtp1BarIvE4CrQIF6wU --api S3v4
$ ./mc config host add local http://localhost HVTH67YJMJ3BVSHPWJOM kAeWXU3qV5vyofP3kTnyEmtp1BarIvE4CrQIF6wU --api S3v4
```

Run MinIO server:
```console
$ sudo ./minio server /data
```

Enable webhooks notification:
```console
$ ./mc admin config set local/ notify_webhook:_ endpoint="http://localhost/_webhooks/s3/events" auth_token="ivitelloniinbouvette"
$ ./mc admin service restart local/
$ ./mc event add local/lossless-songs arn:minio:sqs::_:webhook --event put
$ ./mc event list local/lossless-songs
$ ./mc event add local/images arn:minio:sqs::_:webhook --event put
$ ./mc event list local/images
```

Install the requirements for the components you need:

```console
$ cd backend
$ python -m venv venv
$ . venv/bin/activate
$ pip install -r apiserver/requirements.txt
$ pip install -r director/requirements.txt
$ pip install -r worker/requirements.txt
```

Then run the microservices:

```console
$ python -m apiserver &
$ python -m director &
```

The director will start any worker as needed.

### Web App

We built our UI using [Preact](https://preactjs.com/). To run it, arm yourself with [Node.js](https://nodejs.org/)
and [Yarn](https://yarnpkg.com/), then do the usual startup sequence:

```console
$ cd webapp
$ yarn install
$ yarn start
```

Wait some moments for it to build everything, then you can go at http://localhost:8080 and start playing around.

You can create users using the API Explorer embedded in the backend.

## Adding some beats

Harmony stores lossless [FLAC](https://xiph.org/flac/) songs and transcodes them on-demand; so you need your music
in `.flac` to be able to import it. 

With the backend running, start `backend/hyadm_add_songs.py` with argument a folder containing your songs.
 
To fetch additional metadata from [Last.fm](https://www.last.fm/) and [MusicBrainz](https://musicbrainz.org/) while
importing, put `LASTFM_API_KEY=**your api key**` inside a new local environment file for the backend at `backend/.env`.
