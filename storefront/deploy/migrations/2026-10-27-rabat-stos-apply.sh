#!/bin/sh
set -e
scp -i "$HOME/.ssh/sonax_vps" -o StrictHostKeyChecking=accept-new \
  deploy/migrations/2026-10-27-rabat-stos.sql \
  root@185.193.114.233:/tmp/rabat-stos.sql
ssh -i "$HOME/.ssh/sonax_vps" -o StrictHostKeyChecking=accept-new root@185.193.114.233 \
  "sqlite3 /opt/sonax/data/sonax.db < /tmp/rabat-stos.sql && echo done"
