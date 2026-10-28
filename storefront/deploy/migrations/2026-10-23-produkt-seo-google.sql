-- Produkt: zakładka „SEO i Google” (fraza kluczowa, adres kanoniczny, dane do Zakupów Google i Google Ads).
-- Tylko dodanie kolumn – istniejące dane bez zmian. Przed uruchomieniem: kopia bazy.
-- Serwer: sqlite3 /opt/sonax/data/sonax.db < 2026-10-23-produkt-seo-google.sql
ALTER TABLE products ADD COLUMN seo_extra_focus_keyword text;
ALTER TABLE products ADD COLUMN seo_extra_canonical text;
ALTER TABLE products ADD COLUMN merchant_google_category text;
ALTER TABLE products ADD COLUMN merchant_exclude integer;
ALTER TABLE products ADD COLUMN merchant_custom_label0 text;
ALTER TABLE products ADD COLUMN merchant_custom_label1 text;
ALTER TABLE products ADD COLUMN merchant_custom_label2 text;
ALTER TABLE products ADD COLUMN merchant_highlights text;
