-- Rodzaj progu: rabat procentowy na ostatnią sztukę stosu albo ta sztuka gratis.
ALTER TABLE products_qty_tiers ADD COLUMN kind text DEFAULT 'percent';
