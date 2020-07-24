#!/bin/sh
# Run me inside an "alpine:3.11" container,
# based upon work at:
# - https://github.com/better/alpine-tensorflow/blob/master/Dockerfile
# - https://github.com/AfsmNGhr/alpine-tensorflow/blob/master/Dockerfile


TENSORFLOW_VERSION=1.15.2

# Install dependencies
apk add --no-cache \
  python3 \
  python3-tkinter \
  py3-numpy \
  py3-numpy-f2py \
  freetype \
  libpng \
  libjpeg-turbo \
  imagemagick \
  graphviz \
  git

apk add --no-cache --virtual=.build-deps \
  bash \
  cmake \
  curl \
  freetype-dev \
  g++ \
  libjpeg-turbo-dev \
  libpng-dev \
  linux-headers \
  make \
  musl-dev \
  openblas-dev \
  patch \
  perl \
  python3-dev \
  py3-numpy-dev \
  rsync \
  sed \
  swig \
  zip

apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community hdf5-dev
apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing py3-h5py

cd /tmp
pip3 install --no-cache-dir wheel keras_applications==1.0.8 keras_preprocessing==1.1.0
$(cd /usr/bin && ln -s python3 python)


# Install Bazel, thanks <https://github.com/davido/bazel-alpine-package>
apk --no-cache add ca-certificates wget
wget -q -O /etc/apk/keys/david@ostrovsky.org-5a0369d6.rsa.pub https://raw.githubusercontent.com/davido/bazel-alpine-package/master/david@ostrovsky.org-5a0369d6.rsa.pub
wget https://github.com/davido/bazel-alpine-package/releases/download/0.26.1/bazel-0.26.1-r0.apk
apk add bazel-0.26.1-r0.apk


# Download and compile Tensorflow
cd /tmp
curl -SL https://github.com/tensorflow/tensorflow/archive/v${TENSORFLOW_VERSION}.tar.gz | tar xzf -

cd /tmp/tensorflow-${TENSORFLOW_VERSION} \
  && sed -i -e '/define TF_GENERATE_BACKTRACE/d' tensorflow/core/platform/default/stacktrace.h \
  && sed -i -e '/define TF_GENERATE_STACKTRACE/d' tensorflow/core/platform/default/stacktrace_handler.cc

# Musl: avoid call to "pthread_getname_np" not implemented in Musl
sed -i -e '/int res = pthread_getname_np/c\    int res = 0;' tensorflow/core/platform/posix/env.cc
touch /usr/include/sys/sysctl.h

# Musl: borrow fix from shaka packager buildscript to add mallinfo struct to malloc.h (for LLVM dependency)
sed -i \
  '/malloc_usable_size/a \\nstruct mallinfo {\n  int arena;\n  int hblkhd;\n  int uordblks;\n};' \
  /usr/include/malloc.h

# Support for Python 3.8
sed -i '/tp_print/ s/nullptr/NULL/' \
  tensorflow/python/eager/pywrap_tfe_src.cc \
  tensorflow/python/lib/core/bfloat16.cc \
  tensorflow/python/lib/core/ndarray_tensor_bridge.cc

# Link on libexecinfo, otherwise it fails on LLVM
apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing libexecinfo-dev libexecinfo-static \
  && sed -i -e 's/"-lpthread"],/"-lpthread", "-lexecinfo"],/g' third_party/llvm/llvm.bzl \
  && sed -i -e '/"-lpthread",/a "-lexecinfo",' third_party/mlir/BUILD \
  && sed -i -e '/"derived_attr_populator_gen"/a linkopts = ["-lexecinfo"],' tensorflow/compiler/mlir/tensorflow/BUILD \
  && sed -i -e '/"op_quant_spec_getters_gen"/a linkopts = ["-lexecinfo"],' tensorflow/compiler/mlir/lite/quantization/BUILD \
  && sed -i -e '/"operator-writer-gen"/a linkopts = ["-lexecinfo"],' tensorflow/compiler/mlir/lite/BUILD

# Configure and build
PYTHON_BIN_PATH=/usr/bin/python \
  PYTHON_LIB_PATH=/usr/lib/python3.8/site-packages \
  CC_OPT_FLAGS="-march=native" \
  TF_NEED_JEMALLOC=1 \
  TF_NEED_GCP=0 \
  TF_NEED_HDFS=0 \
  TF_NEED_S3=0 \
  TF_ENABLE_XLA=0 \
  TF_NEED_GDR=0 \
  TF_NEED_VERBS=0 \
  TF_NEED_OPENCL=0 \
  TF_NEED_CUDA=0 \
  TF_NEED_MPI=0 \
  bash configure

# RAM,cores,IO
LOCAL_RESOURCES=6144,2.0,1.0
bazel build -c opt --local_resources ${LOCAL_RESOURCES} //tensorflow/tools/pip_package:build_pip_package \
  --config=nogcp --config=noaws --config=nohdfs --config=noignite --config=nokafka --config=nonccl

./bazel-bin/tensorflow/tools/pip_package/build_pip_package /tmp/tensorflow_pkg
cp /tmp/tensorflow_pkg/tensorflow-${TENSORFLOW_VERSION}-cp36-cp36m-linux_x86_64.whl /root


# Make sure it's built properly
RUN pip3 install --no-cache-dir /root/tensorflow-${TENSORFLOW_VERSION}-cp36-cp36m-linux_x86_64.whl \
    && python3 -c 'import tensorflow as tf; print(tf.__version__)'

mkdir -p /out/tensorflow
cp /tmp/tensorflow_pkg/* /out/tensorflow  # tensorflow-1.15.2-cp38-cp38-linux_x86_64.whl
