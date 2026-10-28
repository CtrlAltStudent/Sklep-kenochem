-- Tryb stron wariantów: switch = jedna karta, link = każdy wariant ma swoją stronę w sklepie.
ALTER TABLE products ADD COLUMN variant_nav text;
