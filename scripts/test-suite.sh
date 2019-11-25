#!/usr/bin/env bash

TUPELO_VERSION=latest COMMUNITY_VERSION=latest docker-compose up --force-recreate --abort-on-container-exit
exitcode=$?
docker-compose down --remove-orphans -v
exit $exitcode