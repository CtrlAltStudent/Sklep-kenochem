-- Rabat za większą ilość: włącznik i daty na produkcie, progi w osobnej tabeli.
ALTER TABLE products ADD COLUMN qty_promo_enabled integer DEFAULT 0;
ALTER TABLE products ADD COLUMN qty_promo_from text;
ALTER TABLE products ADD COLUMN qty_promo_to text;
CREATE TABLE IF NOT EXISTS products_qty_tiers (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  id text PRIMARY KEY NOT NULL,
  qty numeric,
  percent numeric,
  FOREIGN KEY (_parent_id) REFERENCES products(id) ON UPDATE no action ON DELETE cascade
);
