#!/bin/sh
set -e
cp -a /opt/sonax/data/sonax.db /opt/sonax/data/sonax-przed-warianty-wyswietlanie-2026-10-26.db
sqlite3 /opt/sonax/data/sonax.db < /tmp/2026-10-26-warianty-wyswietlanie.sql
sqlite3 /opt/sonax/data/sonax.db "SELECT name FROM pragma_table_info('products') WHERE name = 'variant_display';"
