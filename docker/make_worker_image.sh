#!/bin/sh

backend_path="$(dirname $0)/../backend"
docker build -t harmony/worker:dev -f "$backend_path/worker/Dockerfile" "$backend_path"
