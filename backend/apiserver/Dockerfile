FROM alpine:3.11

# Common layers between Harmony python images

COPY common/requirements.txt /app/common/

RUN set -ex \
  && apk add --no-cache python3 \
  && python3 -m pip install --no-cache-dir -r /app/common/requirements.txt

COPY common /app/common

# Layers for the apiserver image

ENV service_package apiserver
COPY ${service_package}/requirements.txt /app/${service_package}/

RUN set -ex \
  && apk add --no-cache --virtual .build-tools \
      gcc musl-dev python3-dev \
  && python3 -m pip install --no-cache-dir -r /app/${service_package}/requirements.txt gunicorn \
  && apk del .build-tools

COPY ${service_package} /app/${service_package}


WORKDIR /app
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD python3 -m apiserver.docker_healthcheck

CMD ["gunicorn", "-c", "apiserver/gunicorn.conf.py", "apiserver.wsgi"]
