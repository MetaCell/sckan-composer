#!/bin/bash

set -e

cd ../backend
./manage.py spectacular --file ../openapi/openapi.yaml

cd ../frontend
rm -rf src/apiclient/backend
npx openapi-generator-cli generate -i ../openapi/openapi.yaml -g typescript-axios -o src/apiclient/backend --type-mappings Date=string
