#!/usr/bin/env bash

set -x -e

tsc
cp -r src/js lib/
api-extractor run --local

npm run build:wasm
