-- Zestawy: flaga na produkcie i skład (produkt + SKU + ilość).
ALTER TABLE products ADD COLUMN bundle integer DEFAULT 0;
CREATE TABLE IF NOT EXISTS products_bundle_items (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  id text PRIMARY KEY NOT NULL,
  product_id integer,
  sku text,
  quantity numeric DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (_parent_id) REFERENCES products(id) ON UPDATE no action ON DELETE cascade
);
