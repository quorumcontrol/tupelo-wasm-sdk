#!/usr/bin/env bash

docker-compose -f docker-compose.yml -f docker-compose.test.yml up --force-recreate --abort-on-container-exit
exitcode=$?
docker-compose down --remove-orphans -v
exit $exitcode
