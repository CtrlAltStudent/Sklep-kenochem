#!/bin/sh
set -e
cp -a /opt/sonax/data/sonax.db /opt/sonax/data/sonax-przed-warianty-strony-2026-10-27.db
sqlite3 /opt/sonax/data/sonax.db < /tmp/2026-10-27-warianty-strony.sql
sqlite3 /opt/sonax/data/sonax.db "SELECT name FROM pragma_table_info('products') WHERE name = 'variant_nav';"
