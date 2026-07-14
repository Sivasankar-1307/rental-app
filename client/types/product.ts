export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: number;
  title: string;
  description?: string;
  category: string;
  price_per_day: number;
  image?: string;
  available: number;
  ratings?: number;
  reviews?: number;
  specs?: string[];
  min_rental_days?: number;
  deposit_amount?: number;
  addons?: Addon[];
  sku?: string;
  total_stock?: number;
  damaged_stock?: number;
  reserved_stock?: number;
  stock_holds?: number;
}

export interface BookingDetails {
  id: string;
  products: CartItem[];
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "confirmed" | "in_progress" | "delivered" | "cancelled";
  shipping_address: Address;
  contact_person: string;
  phone: string;
  special_requirements?: string;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
  start_date?: string;
  end_date?: string;
  selectedAddons?: Addon[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  lat?: number;
  lng?: number;
}