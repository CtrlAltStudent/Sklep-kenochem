#!/bin/sh
set -e
KEY="$HOME/.ssh/sonax_vps"
ssh -i "$KEY" -o BatchMode=yes root@185.193.114.233 python3 -c 'import sqlite3; from urllib.parse import urlparse; c=sqlite3.connect("/opt/sonax/data/sonax.db"); hosts={}; samples={};
exec("for (url,) in c.execute(\"SELECT url FROM products_images WHERE url IS NOT NULL AND url != %s\" % chr(39)*0): pass")
'
