# Kolumny wyglądu strony głównej. Uruchamiać raz na bazie, zanim wystartuje nowy kod.
# Idempotentne: istniejąca kolumna jest pomijana.
import sqlite3, sys

db = sys.argv[1]
c = sqlite3.connect(db)
cols = [
    ("category_kicker", "TEXT"),
    ("category_title", "TEXT"),
    ("category_style", "TEXT"),
    ("category_columns", "TEXT"),
    ("show_category_count", "INTEGER"),
    ("show_category_icon", "INTEGER"),
    ("usage_kicker", "TEXT"),
    ("usage_title", "TEXT"),
    ("usage_steps_title", "TEXT"),
    ("deals_title", "TEXT"),
    ("newest_title", "TEXT"),
    ("brands_title", "TEXT"),
    ("about_kicker", "TEXT"),
    ("about_title", "TEXT"),
    ("about_text", "TEXT"),
    ("about_link_label", "TEXT"),
    ("about_link", "TEXT"),
    ("about_image_id", "INTEGER"),
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

if "categories_id" not in have("homepage_rels"):
    c.execute("alter table homepage_rels add column categories_id integer references categories(id) on update no action on delete set null")
    print("add homepage_rels categories_id")
if "categories_id" not in have("_homepage_v_rels"):
    c.execute("alter table _homepage_v_rels add column categories_id integer references categories(id) on update no action on delete set null")
    print("add _homepage_v_rels categories_id")

c.executescript("""
CREATE TABLE IF NOT EXISTS homepage_shortcuts (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  id text PRIMARY KEY NOT NULL,
  label text,
  url text,
  kind text,
  icon text,
  FOREIGN KEY (_parent_id) REFERENCES homepage(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS homepage_shortcuts_order_idx ON homepage_shortcuts (_order);
CREATE INDEX IF NOT EXISTS homepage_shortcuts_parent_id_idx ON homepage_shortcuts (_parent_id);
CREATE TABLE IF NOT EXISTS _homepage_v_version_shortcuts (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  id integer PRIMARY KEY NOT NULL,
  label text,
  url text,
  kind text,
  icon text,
  _uuid text,
  FOREIGN KEY (_parent_id) REFERENCES _homepage_v(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS _homepage_v_version_shortcuts_order_idx ON _homepage_v_version_shortcuts (_order);
CREATE INDEX IF NOT EXISTS _homepage_v_version_shortcuts_parent_id_idx ON _homepage_v_version_shortcuts (_parent_id);
""")
c.commit()
print("ok", db)
