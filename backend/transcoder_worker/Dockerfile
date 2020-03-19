FROM alpine:3.11

# Common layers between Harmony python images

COPY common/requirements.txt /app/common/

RUN set -ex \
  && apk add --no-cache python3 \
  && python3 -m pip install --no-cache-dir -r /app/common/requirements.txt

COPY common /app/common

# Layers for the transcoder-worker image

ENV service_package transcoder_worker
COPY ${service_package}/requirements.txt /app/${service_package}/

RUN set -ex \
  && python3 -m pip install --no-cache-dir -r /app/${service_package}/requirements.txt

COPY ${service_package} /app/${service_package}


WORKDIR /app

CMD ["python3", "-m", "transcoder_worker"]
