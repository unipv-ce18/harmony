#!/bin/sh
# Run me inside an "alpine:3.11" containera,
# see: https://stackoverflow.com/a/50298320

export BUILD_DEPS='alpine-sdk git diffutils'

apk update
apk add $BUILD_DEPS

adduser -D apk
adduser apk abuild

sudo -iu apk abuild-keygen -an
sudo -iu apk git clone --depth=1 -b pr-llvm-7 https://github.com/xentec/aports
sudo -iu apk sh -xec 'cd aports/main/llvm7; abuild -r'

mkdir -p /out
cp -r /home/apk/.abuild /home/apk/packages /out

echo 'Use the following commands to install:'
echo '  cp .abuild/*.rsa.pub /etc/apk/keys'
echo '  apk add packages/main/$(uname -m)/*.apk'

deluser --remove-home apk
rm -rf /var/cache/apk/APKINDEX*
apk del --no-cache $BUILD_DEPS
