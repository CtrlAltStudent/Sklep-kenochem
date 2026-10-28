#!/bin/sh
DB=/opt/sonax/data/sonax.db
if sqlite3 "$DB" "SELECT name FROM pragma_table_info('products') WHERE name='bundle';" | grep -q bundle; then
  echo already
else
  sqlite3 "$DB" < /tmp/zestawy.sql
  echo applied
fi
