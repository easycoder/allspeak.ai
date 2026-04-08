#!/bin/bash
# Deploy AllSpeak site to allspeak.eclecity.net

scp -r deploy/* "allspeak@allspeak.ai:allspeak.ai/"
