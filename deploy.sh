#!/bin/bash
# Deploy AllSpeak site to allspeak.ai

# Sync dist to deploy/dist
cp dist/allspeak.js dist/allspeak-min.js deploy/dist/
cp dist/LanguagePack_*.js deploy/dist/ 2>/dev/null

# Update deploy/code with latest editor and server files
cp code/asedit.as code/asedit.json code/allspeak.as code/edit.html code/code-version deploy/code/

# Rebuild per-language starter zips
bash code/zip.sh

# Save a timestamped copy of allspeak.js to history
cp dist/allspeak.js "tools/history/allspeak-$(date +%s).js"

# Upload only changed files to server
PREV=tools/deploy-prev

if [ -d "$PREV" ]; then
    # Find changed files by comparing against previous deploy
    changed=$(diff -rq deploy/ "$PREV/" 2>/dev/null | grep "^Files deploy/" | sed 's|^Files deploy/\(.*\) and .*|\1|')
    new=$(diff -rq deploy/ "$PREV/" 2>/dev/null | grep "^Only in deploy" | sed 's|^Only in deploy/\(.*\): \(.*\)|\1/\2|; s|^/||')
    files="$changed"$'\n'"$new"
    files=$(echo "$files" | sed '/^$/d' | sort -u)

    if [ -z "$files" ]; then
        echo "No changes to deploy."
        exit 0
    fi

    echo "Deploying changed files:"
    failed=0
    for f in $files; do
        echo "  $f"
        scp "deploy/$f" "allspeak@allspeak.ai:allspeak.ai/$f" || { failed=1; break; }
    done
    if [ $failed -ne 0 ]; then
        echo "Upload failed — snapshot NOT updated."
        exit 1
    fi
else
    echo "No previous deploy snapshot — uploading everything."
    scp -r deploy/* "allspeak@allspeak.ai:allspeak.ai/" || {
        echo "Upload failed — snapshot NOT updated."
        exit 1
    }
fi

# Only update snapshot after successful upload
rm -rf "$PREV"
cp -a deploy/ "$PREV"
echo "Snapshot updated."
