#!/bin/bash
# Build per-language starter zips in the deploy directory
cd "$(dirname "$0")/.."

for lang in starter/*/; do
    name=$(basename "$lang")
    zip -j "deploy/allspeak-${name}.zip" "${lang}"CLAUDE.md "${lang}"allspeak.as "${lang}"edit.html
    echo "Built deploy/allspeak-${name}.zip"
done
