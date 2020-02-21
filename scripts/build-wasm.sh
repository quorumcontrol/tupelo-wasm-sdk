#!/usr/bin/env bash

set -x -e

pushd $(dirname "$0")/../builddocker
trap popd EXIT

if hash go >/dev/null 2>&1 ; then
  GOPATH=$(go env GOPATH)
else
  mkdir -p $(pwd)/.gopath/pkg/mod
  GOPATH=$(pwd)/.gopath
fi

export GOPATH

docker-compose run --rm builder
