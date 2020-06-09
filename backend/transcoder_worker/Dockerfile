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

ENV PACKAGER_VERSION=2.4.1
ENV AUDIOWAVEFORM_VERSION=1.4.2

ENV service_package transcoder_worker
COPY ${service_package}/requirements.txt /app/${service_package}/

RUN set -ex \
  && apt-get update \
  && apt-get install --no-install-recommends --no-install-suggests -y \
       ffmpeg \
  # Snapshot installed packages so we can remove build deps later
  && savedAptMark=$(apt-mark showmanual) \
  # Add install time package dependencies
  && apt-get install --no-install-recommends --no-install-suggests -y \
       python3-setuptools curl \
       git make cmake gcc g++ libmad0-dev libid3tag0-dev libsndfile1-dev libgd-dev \
       libboost-filesystem-dev libboost-program-options-dev libboost-regex-dev \
  # Compile audiowaveform
  && build_dir=$(mktemp -d) && cd ${build_dir} \
  && git clone --branch ${AUDIOWAVEFORM_VERSION} --depth 1 https://github.com/bbc/audiowaveform.git \
  && mkdir audiowaveform/build && cd audiowaveform/build \
  && cmake -D ENABLE_TESTS=0 -D BUILD_STATIC=1 .. \
  && make \
  # Add worker requirements
  && python3 -m pip install --no-cache-dir -r /app/${service_package}/requirements.txt \
  && curl -fsSL -o /app/${service_package}/packager-linux \
       https://github.com/google/shaka-packager/releases/download/v${PACKAGER_VERSION}/packager-linux \
  && chmod 0755 /app/${service_package}/packager-linux \
  && mv ${build_dir}/audiowaveform/build/audiowaveform /app/${service_package}/audiowaveform \
  # Cleanup
  && apt-mark showmanual | xargs apt-mark auto > /dev/null \
  && { [ -z "$savedAptMark" ] || apt-mark manual $savedAptMark; } \
  && apt-get remove --purge --auto-remove -y \
  && rm -rf /var/lib/apt/lists/* ${build_dir}

COPY ${service_package} /app/${service_package}


WORKDIR /app

# Put job files in tmpfs
ENV WORK_DIR /dev/shm

CMD ["python3", "-m", "transcoder_worker"]
