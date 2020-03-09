FROM alpine:3.10

# Common layers between Harmony python images

COPY common/requirements.txt /app/common/

RUN set -ex \
  && apk add --no-cache python3 \
  && python3 -m pip install --no-cache-dir -r /app/common/requirements.txt

COPY common /app/common

# Layers for the apiserver image

COPY apiserver/requirements.txt /app/apiserver/

RUN set -ex \
  && python3 -m pip install --no-cache-dir -r /app/apiserver/requirements.txt gunicorn

COPY apiserver /app/apiserver


WORKDIR /app
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD python3 -m apiserver.docker_healthcheck

CMD ["gunicorn", "-c", "apiserver/gunicorn.conf.py", "apiserver.wsgi"]
