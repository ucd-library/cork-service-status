#! /bin/bash
# Makes sure you can pull from the webhook artifact registry
set -e

gcloud auth configure-docker \
    us-west1-docker.pkg.dev
