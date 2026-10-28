import sqlite3, os
p = os.path.join(os.path.dirname(__file__), "..", "..", "sonax.db")
p = os.path.abspath(p)
print("db", p, "exists", os.path.exists(p))
db = sqlite3.connect(p)
cols = [r[1] for r in db.execute("PRAGMA table_info(products)")]
print("variant cols before", [c for c in cols if "variant" in c])
if "variant_nav" not in cols:
    db.execute("ALTER TABLE products ADD COLUMN variant_nav text")
    db.commit()
    print("added variant_nav")
else:
    print("already has variant_nav")
print("variant cols after", [r[1] for r in db.execute("PRAGMA table_info(products)") if "variant" in r[1]])
