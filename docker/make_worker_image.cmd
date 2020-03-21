@echo off

set "backend_path=%~dp0\..\backend"
docker build -t harmony/transcoder-worker:dev -f "%backend_path%/transcoder_worker/Dockerfile" "%backend_path%"
