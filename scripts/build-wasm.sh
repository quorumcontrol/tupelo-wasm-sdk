#!/usr/bin/env bash

set -x -e

pushd $(dirname "$0")/../tupelo-go-sdk
trap popd EXIT

export GOPATH=`go env GOPATH`

go mod download

popd
pushd $(dirname "$0")/../builddocker

docker-compose run --rm builder
