# Pola baneru „zdjęcie z produktem”. Uruchamiać raz, zanim wystartuje nowy kod.
import sqlite3, sys

db = sys.argv[1]
c = sqlite3.connect(db)

cols = [
    ("scene_kicker", "TEXT"),
    ("scene_title", "TEXT"),
    ("scene_hint", "TEXT"),
    ("scene_note", "TEXT"),
    ("scene_spot_x", "NUMERIC"),
    ("scene_spot_y", "NUMERIC"),
    ("scene_image_id", "INTEGER"),
    ("scene_spots", "TEXT"),
]

def have(table):
    return {r[1] for r in c.execute(f"pragma table_info({table})")}

def add(table, name, typ):
    if name not in have(table):
        c.execute(f"alter table {table} add column {name} {typ}")
        print("add", table, name)

for name, typ in cols:
    add("homepage", name, typ)
    add("_homepage_v", "version_" + name, typ)

for table in ("homepage_rels", "_homepage_v_rels"):
    if "products_id" not in have(table):
        c.execute(f"alter table {table} add column products_id integer references products(id) on update no action on delete set null")
        print("add", table, "products_id")

c.commit()
print("ok", db)
