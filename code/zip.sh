#!/bin/bash
# Build per-language starter zips in the deploy directory
cd "$(dirname "$0")/.."

for lang in starter/*/; do
    name=$(basename "$lang")
    zip -j "deploy/allspeak-${name}.zip" "${lang}"CLAUDE.md "${lang}"server.as "${lang}"edit.html code/asedit.json code/asedit.as
    echo "Built deploy/allspeak-${name}.zip"
done
