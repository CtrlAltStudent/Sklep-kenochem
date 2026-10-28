-- Loga marek na stronie głównej (tablica przy ustawieniach strony głównej).
CREATE TABLE IF NOT EXISTS homepage_brand_logos (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  id text PRIMARY KEY NOT NULL,
  logo_id integer,
  name text,
  link text,
  FOREIGN KEY (logo_id) REFERENCES media(id) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (_parent_id) REFERENCES homepage(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS homepage_brand_logos_order_idx ON homepage_brand_logos (_order);
CREATE INDEX IF NOT EXISTS homepage_brand_logos_parent_id_idx ON homepage_brand_logos (_parent_id);
CREATE INDEX IF NOT EXISTS homepage_brand_logos_logo_idx ON homepage_brand_logos (logo_id);

CREATE TABLE IF NOT EXISTS _homepage_v_version_brand_logos (
  _order integer NOT NULL,
  _parent_id integer NOT NULL,
  id integer PRIMARY KEY NOT NULL,
  logo_id integer,
  name text,
  link text,
  _uuid text,
  FOREIGN KEY (logo_id) REFERENCES media(id) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (_parent_id) REFERENCES _homepage_v(id) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS _homepage_v_version_brand_logos_order_idx ON _homepage_v_version_brand_logos (_order);
CREATE INDEX IF NOT EXISTS _homepage_v_version_brand_logos_parent_id_idx ON _homepage_v_version_brand_logos (_parent_id);
CREATE INDEX IF NOT EXISTS _homepage_v_version_brand_logos_logo_idx ON _homepage_v_version_brand_logos (logo_id);
