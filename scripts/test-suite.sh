#!/usr/bin/env bash

TUPELO_VERSION=master COMMUNITY_VERSION=master docker-compose up --force-recreate --abort-on-container-exit
exitcode=$?
docker-compose down --remove-orphans -v
exit $exitcode