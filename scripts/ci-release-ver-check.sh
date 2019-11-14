#!/usr/bin/env bash

set -e

release_ver=$(echo "$GITHUB_REF" | rev | cut -d / -f 1 | rev | grep -o -P "\d+\.\d+\.\d+")
package_ver=$(npm list tupelo-wasm-sdk | grep -o -P "tupelo-wasm-sdk@\d+\.\d+\.\d+" | grep -o -P "\d+\.\d+\.\d+")

if [ "$release_ver" -ne "$package_ver" ]; then
  echo "ERROR: mismatched versions"
  echo " > release version $release_ver"
  echo " > package version $package_ver"
  exit 1
fi