#!/usr/bin/env bash

set -x -e

tsc
npm run build:wasm
cp -r src/js lib/
api-extractor run --local
