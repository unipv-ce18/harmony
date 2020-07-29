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
  # Obtain signing key for LLVM 7 repo
  && SIGN_KEY_PATH=/etc/apk/keys/apk-5f182cff.rsa.pub \
  && SIGN_KEY_HASH=21978abcc470363040b0a1dc75ce32edf0874470e3e90987524791f1c7b8e42b \
  && wget -O ${SIGN_KEY_PATH} https://luca.zanus.si/unipv/se/harmony-alpine/apk-5f182cff.rsa.pub \
  && if [ "$SIGN_KEY_HASH" != "$(sha256sum ${SIGN_KEY_PATH} | cut -d ' ' -f1)" ]; then \
       echo 'Package signing key hash does not match'; \
       exit 1; \
     fi \
  \
  # Add worker requirements
  && apk add --no-cache libstdc++ libexecinfo libgomp libsndfile openblas \
  #&& apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community hdf5
  && apk add --repository https://luca.zanus.si/unipv/se/harmony-alpine llvm7-libs \
  && python3 -m pip install --no-cache-dir --prefer-binary --ignore-requires-python \
       --extra-index-url https://luca.zanus.si/unipv/se/harmony-wheels \
       -r /app/${service_package}/requirements.txt \
  \
  # Prefetch 2stems model for Spleeter
  && apk add --no-cache --virtual .fetch-deps curl \
  && curl -OL https://github.com/deezer/spleeter/releases/download/v1.4.0/{2stems.tar.gz,checksum.json} \
  && DL_SUM=$(sha256sum 2stems.tar.gz | cut -d ' ' -f 1) \
  && REF_SUM=$(awk -F '"' '/2stems/{print $4}' checksum.json) \
  && if [ "$DL_SUM" != "$REF_SUM" ]; then \
       echo 'Downloaded checksums do not match'; \
       exit 1; \
     fi \
  && mkdir -p /app/pretrained_models/2stems \
  && tar xf 2stems.tar.gz -C /app/pretrained_models/2stems \
  && apk del .fetch-deps \
  && rm 2stems.tar.gz checksum.json \
  \
  # Check if everything works
  && for pkg in numpy scipy sklearn numba pandas tensorflow librosa; do \
       python3 -c "import $pkg; print(\"$pkg: \" + $pkg.__version__)"; \
     done

RUN set -ex \
  # Fetch Worker binaries
  && apk add --no-cache ffmpeg \
  && apk add --no-cache --virtual .fetch-deps curl gnupg \
  && curl -fL --remote-name-all \
       https://luca.zanus.si/unipv/se/harmony-musl-binaries/packager-v${PACKAGER_VERSION}{,.sig} \
       https://luca.zanus.si/unipv/se/harmony-musl-binaries/audiowaveform-v${AUDIOWAVEFORM_VERSION}{,.sig} \
  && packager_bin=./packager-v${PACKAGER_VERSION} \
  && audiowaveform_bin=./audiowaveform-v${AUDIOWAVEFORM_VERSION} \
  \
  # Verify GPG signatures
  && gpg --auto-key-locate nodefault,wkd --locate-keys $(printf bHVjYUB6YW51cy5zaQ== | base64 -d) \
  && gpg --output ./binaries.keyring --export 0x003B046D91142A70B830CA2967406F8F40BAFCAB \
  && gpgv --keyring ./binaries.keyring ${packager_bin}.sig ${packager_bin} \
  && gpgv --keyring ./binaries.keyring ${audiowaveform_bin}.sig ${audiowaveform_bin} \
  \
  # Move inside application dir
  && install -m 0755 ${packager_bin} /app/${service_package}/packager-linux \
  && install -m 0755 ${audiowaveform_bin} /app/${service_package}/audiowaveform \
  \
  # Cleanup
  && apk del .fetch-deps \
  && rm -rf /root/.gnupg ./binaries.keyring ./packager-v* ./audiowaveform-v*

COPY ${service_package} /app/${service_package}


WORKDIR /app

# Put job files in tmpfs
ENV WORK_DIR /dev/shm

CMD ["python3", "-m", "worker"]
