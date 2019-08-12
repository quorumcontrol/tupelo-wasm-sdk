#!/usr/bin/env bash

set -x -e

tsc
cp -r src/js lib/
api-extractor run --local && api-documenter markdown --input-folder ./temp --output-folder docs
rm -r ./temp