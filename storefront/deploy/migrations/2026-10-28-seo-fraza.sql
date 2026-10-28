-- Fraza kluczowa w grupie SEO (produkty, podstrony, blog, kategorie).
ALTER TABLE products ADD COLUMN seo_focus_keyword text;
ALTER TABLE pages ADD COLUMN seo_focus_keyword text;
ALTER TABLE posts ADD COLUMN seo_focus_keyword text;
ALTER TABLE categories ADD COLUMN seo_focus_keyword text;
ALTER TABLE _pages_v ADD COLUMN version_seo_focus_keyword text;
ALTER TABLE _posts_v ADD COLUMN version_seo_focus_keyword text;
