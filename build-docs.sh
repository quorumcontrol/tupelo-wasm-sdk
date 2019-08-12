#!/usr/bin/env bash

set -x -e

api-extractor run --local
api-documenter markdown --input-folder ./temp --output-folder docs
rm -r ./temp