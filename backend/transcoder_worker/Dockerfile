# Need Debian because packager depends on glibc
FROM debian:buster-slim

# Common layers between Harmony python images

COPY common/requirements.txt /app/common/

RUN set -ex \
  && apt-get update \
  && apt-get install --no-install-recommends --no-install-suggests -y python3-pip \
  && python3 -m pip install --no-cache-dir -r /app/common/requirements.txt \
  && apt-get remove --purge --auto-remove -y && rm -rf /var/lib/apt/lists/*

COPY common /app/common

# Layers for the transcoder-worker image

ENV service_package transcoder_worker
COPY ${service_package}/requirements.txt /app/${service_package}/

RUN set -ex \
  && apt-get update \
  && apt-get install --no-install-recommends --no-install-suggests -y \
       ffmpeg \
  # Snapshot installed packages so we can remove build deps later
  && savedAptMark=$(apt-mark showmanual) \
  # Install the thing
  && apt-get install --no-install-recommends --no-install-suggests -y \
       python3-setuptools curl \
  && python3 -m pip install --no-cache-dir -r /app/${service_package}/requirements.txt \
  && curl -fsSL -o /app/${service_package}/packager-linux \
       https://github.com/google/shaka-packager/releases/download/v2.4.1/packager-linux \
  && chmod 0755 /app/${service_package}/packager-linux \
  # Cleanup
  && apt-mark showmanual | xargs apt-mark auto > /dev/null \
  && { [ -z "$savedAptMark" ] || apt-mark manual $savedAptMark; } \
  && apt-get remove --purge --auto-remove -y && rm -rf /var/lib/apt/lists/*

COPY ${service_package} /app/${service_package}


WORKDIR /app

# Put job files in tmpfs
ENV WORK_DIR /dev/shm

CMD ["python3", "-m", "transcoder_worker"]
