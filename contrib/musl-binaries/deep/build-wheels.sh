#!/bin/sh
# Run me inside an "alpine:3.11" container,
# this builds all the wheels required for worker analysis functionality
# and puts them in /out/wheels... it may take some hours to complete.

apk add --no-cache gcc g++ make musl-dev python3-dev openblas-dev libsndfile-dev
pip3 install wheel

mkdir -p /out/wheels
export PIP_FIND_LINKS=/out/wheels
export PIP_WHEEL_DIR=/out/wheels

# Install LLVM 7.0 for llvmlite 0.31 to work properly
cp /out/.abuild/*.rsa.pub /etc/apk/keys
apk add /out/packages/main/$(uname -m)/*.apk

# Note: no build isolation for packages that need numpy installed

# Let's make these wheels
pip3 wheel llvmlite==0.31.0 numpy
pip3 install numpy
pip3 wheel --no-build-isolation numba==0.48.0  # no build isolation because it requires numpy in setup.py
pip3 wheel aubio
pip3 wheel librosa==0.7.2  # This also builds scipy and scikit-learn

# Pandas 0.25.1 requires numpy<0.19 to not incur in issue pandas/pandas#34969
apk add --no-cache py3-numpy-dev
pip3 wheel --no-build-isolation pandas==0.25.1  # ibid.

# TensorFlow (required by spleeter) wants grpcio, cffi and h5py
apk add --no-cache linux-headers libffi-dev
apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community hdf5-dev

# Spleeter wants py3.7 and pip, but we are compiling for 3.8
# and --ignore-requires-python does not work for pip wheel (that's a bug).
# So we download spleeter, patch its setup.py and build the wheel from there.
pip3 download --no-deps --python-version 3.7.8 spleeter==1.5.4
tar xf spleeter-1.5.4.tar.gz
rm spleeter-1.5.4.tar.gz
sed -i "/python_requires/c python_requires='>=3.6'," spleeter-1.5.4/setup.py
pip wheel ./spleeter-1.5.4
rm -rf ./spleeter-1.5.4
