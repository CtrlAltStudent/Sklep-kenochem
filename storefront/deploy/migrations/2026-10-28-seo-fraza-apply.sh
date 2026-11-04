#!/bin/sh
set -e
scp -i "$HOME/.ssh/sonax_vps" -o StrictHostKeyChecking=accept-new \
  deploy/migrations/_apply_seo.py \
  root@185.193.114.233:/tmp/apply_seo.py
ssh -i "$HOME/.ssh/sonax_vps" -o StrictHostKeyChecking=accept-new root@185.193.114.233 \
  "python3 /tmp/apply_seo.py /opt/sonax/data/sonax.db" 
