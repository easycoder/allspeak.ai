#!/bin/bash
# Deploy AllSpeak site to allspeak.ai

scp -r deploy/* "allspeak@allspeak.ai:allspeak.ai/"
