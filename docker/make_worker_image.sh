#!/bin/sh

backend_path="$(dirname $0)/../backend"
docker build -t harmony/transcoder-worker:dev -f "$backend_path/transcoder_worker/Dockerfile" "$backend_path"
