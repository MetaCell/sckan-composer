#!/bin/bash

set -e

cd ../backend
./manage.py spectacular --file ../openapi/openapi.yaml

cd ../frontend
rm -rf src/apiclient/backend
java -jar ./openapi-generator-cli-5.4.0.jar generate -i ../openapi/openapi.yaml -g typescript-axios -o src/apiclient/backend --type-mappings Date=string
