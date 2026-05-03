export type BaseType = 'E27' | 'E14' | 'GU10' | 'G9' | 'G4';

export type DeliveryType = 'pickup' | 'courier';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'packing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type SortOption = 'priceAsc' | 'priceDesc' | 'nameAsc';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  priceMinor: number;
  stockQty: number;
  baseType: BaseType;
  wattage: number;
  colorTemperatureK: number;
  luminousFluxLm: number;
  isActive: boolean;
  images: string[];
}

export interface CartItem {
  productId: string;
  qty: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  baseType?: BaseType;
  wattage?: number;
  colorTemperatureK?: number;
  inStock?: boolean;
  sortBy?: SortOption;
}

export interface OrderItemSnapshot {
  productId: string;
  sku: string;
  name: string;
  baseType: BaseType;
  wattage: number;
  colorTemperatureK: number;
  unitPriceMinor: number;
  qty: number;
  lineTotalMinor: number;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  email: string;
  deliveryType: DeliveryType;
  address?: string;
  comment?: string;
  items: { productId: string; qty: number }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  sessionId: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryType: DeliveryType;
  address?: string;
  comment?: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  totalMinor: number;
  createdAt: string;
}
