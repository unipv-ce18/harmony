#!/bin/sh
# Copies wheels in src_dir to a PEP 503 repository directory structure in dst_dir

if [ $# -lt 2 ]; then
    echo "Usage: $0 [src_dir] [dst_dir]"
    exit 1
fi

for fpath in $1/*.whl; do
    fname=$(basename "$fpath")
    pkgname=$(echo ${fname%%-*} | tr _ -)
    mkdir -p $2/${pkgname}
    cp $fpath $2/${pkgname}/
    echo $fname
done
