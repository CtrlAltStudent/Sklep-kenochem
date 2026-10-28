-- Warianty pojemności: produkt może należeć do karty innego produktu (variant_of_id).
-- Tylko dodanie kolumn. Przed uruchomieniem: kopia bazy.
-- Serwer: sqlite3 /opt/sonax/data/sonax.db < 2026-10-26-warianty.sql
ALTER TABLE products ADD COLUMN variant_of_id integer;
ALTER TABLE products ADD COLUMN variant_sort numeric;
CREATE INDEX IF NOT EXISTS products_variant_of_idx ON products (variant_of_id);
