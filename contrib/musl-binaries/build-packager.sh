#!/bin/sh
# Run me inside an "alpine:3.11" container,
# the built binary requires "libgcc libstdc++" to run

set -ex
PACKAGER_VERSION=2.4.2

# depot_tools still requires python2
# https://github.com/google/shaka-packager/issues/763
apk add --no-cache bash build-base curl findutils git ninja python \
    bsd-compat-headers linux-headers libexecinfo-dev

builddir=$(mktemp -d)
cd $builddir

git clone --depth 1 https://chromium.googlesource.com/chromium/tools/depot_tools.git
export PATH=$PATH:$PWD/depot_tools

# See "https://github.com/google/shaka-packager/blob/master/docs/source/build_instructions.md#alpine-linux"
sed -i \
    '/malloc_usable_size/a \\nstruct mallinfo {\n  int arena;\n  int hblkhd;\n  int uordblks;\n};' \
    /usr/include/malloc.h

mkdir shaka_packager && cd shaka_packager

export GYP_DEFINES='clang=0 use_experimental_allocator_shim=0 use_allocator=none musl=1'
GCLIENT_PY3=0 gclient config https://www.github.com/google/shaka-packager.git --name=src --unmanaged
GCLIENT_PY3=0 gclient sync --no-history -r v${PACKAGER_VERSION}
cd src
ninja -C out/Release

mkdir /out
mv out/Release/packager /out/packager-v${PACKAGER_VERSION}
