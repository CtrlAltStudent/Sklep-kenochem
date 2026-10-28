-- Kwota darmowej dostawy osobno dla kuriera oraz profil pracownika (stanowisko, telefon, kolor panelu).
ALTER TABLE store_settings_shipping_methods ADD COLUMN free_from numeric;
ALTER TABLE users ADD COLUMN job_title text;
ALTER TABLE users ADD COLUMN phone text;
ALTER TABLE users ADD COLUMN panel_theme text;
