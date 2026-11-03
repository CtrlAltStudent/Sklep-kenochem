# Godzina wysyłki tego samego dnia. Uruchamiać raz, zanim wystartuje nowy kod.
import sqlite3, sys

db = sys.argv[1]
c = sqlite3.connect(db)
have = {r[1] for r in c.execute("pragma table_info(store_settings)")}
if "same_day_shipping" not in have:
    c.execute("alter table store_settings add column same_day_shipping integer")
    print("add same_day_shipping")
if "ship_cutoff" not in have:
    c.execute("alter table store_settings add column ship_cutoff text")
    print("add ship_cutoff")
c.execute("update store_settings set same_day_shipping = 1 where same_day_shipping is null")
c.execute("update store_settings set ship_cutoff = '14:00' where ship_cutoff is null or ship_cutoff = ''")
c.commit()
print("ok", db)
