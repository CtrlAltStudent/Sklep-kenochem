import sqlite3, sys
c = sqlite3.connect(sys.argv[1] if len(sys.argv) > 1 else "sonax.db")
tables = {r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
jobs = [
    ("products", "seo_focus_keyword", "ALTER TABLE products ADD COLUMN seo_focus_keyword text"),
    ("pages", "seo_focus_keyword", "ALTER TABLE pages ADD COLUMN seo_focus_keyword text"),
    ("posts", "seo_focus_keyword", "ALTER TABLE posts ADD COLUMN seo_focus_keyword text"),
    ("categories", "seo_focus_keyword", "ALTER TABLE categories ADD COLUMN seo_focus_keyword text"),
    ("_pages_v", "version_seo_focus_keyword", "ALTER TABLE _pages_v ADD COLUMN version_seo_focus_keyword text"),
    ("_posts_v", "version_seo_focus_keyword", "ALTER TABLE _posts_v ADD COLUMN version_seo_focus_keyword text"),
    ("_products_v", "version_seo_focus_keyword", "ALTER TABLE _products_v ADD COLUMN version_seo_focus_keyword text"),
]
for table, col, ddl in jobs:
    if table not in tables:
        print("skip", table)
        continue
    cols = {r[1] for r in c.execute(f"PRAGMA table_info({table})")}
    if col in cols:
        print("exists", table, col)
    else:
        c.execute(ddl)
        print("added", table, col)
c.commit()
