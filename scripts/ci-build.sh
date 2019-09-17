#!/usr/bin/env bash

set -e

mkdir -p ~/ssh
echo "$SSH_PRIVATE_KEY" > ~/ssh/id_rsa
chmod 600 ~/ssh/id_rsa
eval "$(ssh-agent -s)" > /dev/null 2>&1
ssh-add ~/ssh/id_rsa > /dev/null 2>&1
git submodule init
git submodule update
npm run build
