#!/bin/bash

set -e

cd ../backend
./manage.py spectacular --file ../openapi/openapi.yaml

cd ../frontend
rm -rf src/rest_tmp

npx openapi-generator-cli generate -i ../openapi/openapi.yaml -g typescript -o src/rest_tmp --type-mappings=Date=string,URI=string -c openapi_config.json

# remove generic files that shouldn't be converted
rm ./src/rest_tmp/models/ObjectSerializer.ts
rm ./src/rest_tmp/models/all.ts

# remove files that are not needed
rm ./src/rest_tmp/models/Paginated*.ts

for file in ./src/rest_tmp/models/*; do
    filename=$(basename $file .ts)
    npx ts-json-schema-generator --path $file -e 'none' --no-top-ref --no-ref-encode -o "./src/schemas/$(basename "$filename.json")"
done

rm -rf src/rest_tmp
