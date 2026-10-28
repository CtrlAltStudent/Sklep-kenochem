// Typy odpowiedzi API BaseLinkera dla metod używanych przez sklep.
// Dokumentacja: https://api.baselinker.com/

export type BLStatus = { status: "SUCCESS" } | { status: "ERROR"; error_code: string; error_message: string };

export type BLInventory = {
  inventory_id: number;
  name: string;
  description?: string;
  languages: string[];
  default_language: string;
  price_groups: number[];
  default_price_group: number;
  warehouses: string[];
  default_warehouse: string;
  reservations?: boolean;
  is_default?: boolean;
};

export type BLPriceGroup = { price_group_id: number; name: string; description?: string; currency: string; is_default: boolean };
export type BLWarehouse = { warehouse_type: string; warehouse_id: number; name: string; description?: string; stock_edition?: boolean; is_default: boolean };
export type BLOrderStatus = { id: number; name: string; name_for_customer?: string; color?: string };
export type BLCategory = { category_id: number; name: string; parent_id: number };

export type BLProductListItem = {
  id: number;
  parent_id?: number;
  ean: string;
  sku: string;
  name: string;
  prices: Record<string, number>;
  stock: Record<string, number>;
};

export type BLProductData = {
  is_bundle?: boolean;
  parent_id?: number;
  sku: string;
  ean: string;
  tax_rate: number;
  weight: number;
  category_id: number;
  manufacturer_id: number;
  prices: Record<string, number>;
  stock: Record<string, number>;
  locations?: Record<string, string>;
  // Klucze: "name", "description", "features", "description_extra1"…, opcjonalnie z sufiksem "|pl|<id źródła>"
  text_fields: Record<string, unknown>;
  images: Record<string, string>;
  variants?: Record<string, { name: string; sku: string; ean: string; prices: Record<string, number>; stock: Record<string, number> }>;
  // Klucz = ID produktu w BaseLinkerze, wartość = liczba sztuk (albo { quantity }).
  bundle_products?: Record<string, number | { quantity?: number }>;
};

export type BLStockItem = { product_id: number; stock: Record<string, number>; variants?: Record<string, Record<string, number>> };

// Kształt zapytania addOrder – zgodny z dokumentacją metody addOrder.
export type BLAddOrderProduct = {
  storage: "db" | "shop" | "warehouse";
  storage_id: number;
  product_id: string;
  variant_id: number;
  name: string;
  sku: string;
  ean: string;
  location: string;
  warehouse_id?: number;
  attributes: string;
  price_brutto: number;
  tax_rate: number;
  quantity: number;
  weight: number;
};

export type BLAddOrder = {
  order_status_id: number;
  custom_source_id?: number;
  date_add: number;
  currency: string;
  payment_method: string;
  payment_method_cod: "0" | "1";
  paid: "0" | "1";
  user_comments: string;
  admin_comments: string;
  email: string;
  phone: string;
  user_login: string;
  delivery_method: string;
  delivery_price: number;
  delivery_fullname: string;
  delivery_company: string;
  delivery_address: string;
  delivery_postcode: string;
  delivery_city: string;
  delivery_state: string;
  delivery_country_code: string;
  delivery_point_id: string;
  delivery_point_name: string;
  delivery_point_address: string;
  delivery_point_postcode: string;
  delivery_point_city: string;
  invoice_fullname: string;
  invoice_company: string;
  invoice_nip: string;
  invoice_address: string;
  invoice_postcode: string;
  invoice_city: string;
  invoice_state: string;
  invoice_country_code: string;
  want_invoice: "0" | "1";
  extra_field_1: string;
  extra_field_2: string;
  products: BLAddOrderProduct[];
};
