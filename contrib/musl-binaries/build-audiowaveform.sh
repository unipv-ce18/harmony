#!/bin/sh
# Run me inside an "alpine:3.11" container,
# the built binary requires "libgcc libstdc++" to run

set -ex
AUDIOWAVEFORM_VERSION=1.4.2
LIBFLAC_VERSION=1.3.3

# Dev dependencies
apk add --no-cache \
  git make cmake gcc g++ libmad-dev libid3tag-dev libsndfile-dev \
  gd-dev boost-dev libgd libpng-dev zlib-dev

# For a static build
apk add --no-cache \
  zlib-static libpng-static boost-static

# For FLAC
apk add --no-cache \
  autoconf automake libtool gettext

builddir=$(mktemp -d)
cd $builddir

# Compile a static build of FLAC
# https://github.com/bbc/audiowaveform#alpine
wget https://github.com/xiph/flac/archive/${LIBFLAC_VERSION}.tar.gz
tar xzf ${LIBFLAC_VERSION}.tar.gz
cd flac-${LIBFLAC_VERSION}
./autogen.sh
./configure --enable-shared=no
make
make install
cd ..

# Compile audiowaveform
git clone --branch ${AUDIOWAVEFORM_VERSION} --depth 1 \
    https://github.com/bbc/audiowaveform.git
mkdir awbuild && cd awbuild
cmake -D ENABLE_TESTS=0 -D BUILD_STATIC=1 ../audiowaveform
make

mkdir /out
mv audiowaveform /out/audiowaveform-v${AUDIOWAVEFORM_VERSION}
