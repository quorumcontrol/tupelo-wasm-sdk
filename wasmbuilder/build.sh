#!/usr/bin/env bash

set -e -x

pushd $(dirname $0)
trap popd EXIT

docker-compose run --rm buildwasm
mv out/tupelo.wasm ../src/js/go/
