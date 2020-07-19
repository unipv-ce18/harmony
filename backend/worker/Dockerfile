FROM alpine:3.11

# Common layers between Harmony python images

COPY common/requirements.txt /app/common/

RUN set -ex \
  && apk add --no-cache python3 \
  && python3 -m pip install --no-cache-dir -r /app/common/requirements.txt

COPY common /app/common

# Layers for the worker image

ENV PACKAGER_VERSION=2.4.2
ENV AUDIOWAVEFORM_VERSION=1.4.2

ENV service_package worker
COPY ${service_package}/requirements.txt /app/${service_package}/

RUN set -ex \
  # Fetch Worker binaries
  && apk add --no-cache libgcc libstdc++ ffmpeg \
  && apk add --no-cache --virtual .fetch-deps curl gnupg \
  && curl -fL --remote-name-all \
       https://luca.zanus.si/unipv/se/harmony-musl-binaries/packager-v${PACKAGER_VERSION}{,.sig} \
       https://luca.zanus.si/unipv/se/harmony-musl-binaries/audiowaveform-v${AUDIOWAVEFORM_VERSION}{,.sig} \
  && packager_bin=./packager-v${PACKAGER_VERSION} \
  && audiowaveform_bin=./audiowaveform-v${AUDIOWAVEFORM_VERSION} \
  # Verify GPG signatures
  && gpg --auto-key-locate nodefault,wkd --locate-keys $(printf bHVjYUB6YW51cy5zaQ== | base64 -d) \
  && gpg --output ./binaries.keyring --export 0x003B046D91142A70B830CA2967406F8F40BAFCAB \
  && gpgv --keyring ./binaries.keyring ${packager_bin}.sig ${packager_bin} \
  && gpgv --keyring ./binaries.keyring ${audiowaveform_bin}.sig ${audiowaveform_bin} \
  # Move inside application dir
  && install -m 0755 ${packager_bin} /app/${service_package}/packager-linux \
  && install -m 0755 ${audiowaveform_bin} /app/${service_package}/audiowaveform \
  # Cleanup
  && apk del .fetch-deps \
  && rm -rf /root/.gnupg ./binaries.keyring ./packager-v* ./audiowaveform-v*

RUN set -ex \
  # Add worker requirements
  && python3 -m pip install --no-cache-dir -r /app/${service_package}/requirements.txt

COPY ${service_package} /app/${service_package}


WORKDIR /app

# Put job files in tmpfs
ENV WORK_DIR /dev/shm

CMD ["python3", "-m", "worker"]
