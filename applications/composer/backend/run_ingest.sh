#!/bin/bash

# Usage:
# ./run_ingest.sh <version> [update_upstream]

# Check if the version argument is provided
if [ -z "$1" ]; then
    echo "Error: Version argument is required."
    exit 1
fi

version=$1
update_upstream_flag=$2  # Optional second argument

# Check if the version is greater than 0.1.8
if [[ "$(printf '%s\n' "0.1.8" "$version" | sort -V | head -n1)" = "0.1.8" ]]; then
    echo "Installing neurondm version $version..."
    pip install neurondm==$version
else
    echo "Error: Version must be greater than 0.1.8."
    exit 1
fi

# Update the ingest_statements command based on the update_upstream_flag
if [ "$update_upstream_flag" == "update_upstream" ]; then
    echo "Running ingest_statements with update_upstream flag..."
    python manage.py ingest_statements --update_upstream
else
    echo "Running ingest_statements without update_upstream flag..."
    python manage.py ingest_statements
fi
