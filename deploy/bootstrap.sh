#!/usr/bin/env sh

envsubst < /service/deploy/config-template.json > /service/packages/service/config/config.json

cd /service/packages/service/ || exit

npm start -- --config=config/config.json

