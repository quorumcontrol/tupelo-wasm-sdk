#!/usr/bin/env bash

set -x -e

pushd $(dirname "$0")/../tupelo-go-sdk
trap popd EXIT

go mod download

popd
pushd $(dirname "$0")/../builddocker

docker-compose run --rm builder
