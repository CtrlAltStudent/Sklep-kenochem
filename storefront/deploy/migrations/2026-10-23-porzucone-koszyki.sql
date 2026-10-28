-- Porzucone koszyki (kolekcja „carts”): koszyki klientów, którzy zgodzili się na przypomnienie mailem.
-- Nowa tabela + kolumna w tabeli blokad edycji panelu. Istniejące dane bez zmian. Przed uruchomieniem: kopia bazy.
-- Serwer: sqlite3 /opt/sonax/data/sonax.db < 2026-10-23-porzucone-koszyki.sql
CREATE TABLE `carts` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`customer_id` integer,
	`summary` text,
	`total` numeric,
	`status` text DEFAULT 'open',
	`order_id` integer,
	`consent_at` text,
	`reminded_at` text,
	`items` text,
	`token` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `carts_email_idx` ON `carts` (`email`);
CREATE INDEX `carts_customer_idx` ON `carts` (`customer_id`);
CREATE INDEX `carts_status_idx` ON `carts` (`status`);
CREATE INDEX `carts_order_idx` ON `carts` (`order_id`);
CREATE UNIQUE INDEX `carts_token_idx` ON `carts` (`token`);
CREATE INDEX `carts_updated_at_idx` ON `carts` (`updated_at`);
CREATE INDEX `carts_created_at_idx` ON `carts` (`created_at`);
ALTER TABLE `payload_locked_documents_rels` ADD COLUMN `carts_id` integer REFERENCES `carts`(`id`) ON DELETE cascade;
CREATE INDEX `payload_locked_documents_rels_carts_id_idx` ON `payload_locked_documents_rels` (`carts_id`);
