#!/usr/bin/env bash

set -x -e

pushd $(dirname "$0")/../tupelo-go-sdk
trap popd EXIT

make vendor

popd
pushd $(dirname "$0")/../builddocker

docker-compose run --rm builder
