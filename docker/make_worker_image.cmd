@echo off
setlocal

set "backend_path=%~dp0\..\backend"
docker build -t harmony/worker:dev -f "%backend_path%/worker/Dockerfile" "%backend_path%"
