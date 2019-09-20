#!/usr/bin/env sh

# This file should be executed INSIDE of docker

set -x

cd /app/tupelo-go-sdk/wasm
GOOS=js GOARCH=wasm go build mod=vendor -gcflags=-trimpath="${PWD}" -asmflags=-trimpath="${PWD}" -ldflags='-s -w' -o /app/src/js/go/tupelo.wasm
