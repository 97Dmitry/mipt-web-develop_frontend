export type BaseType = 'E27' | 'E14' | 'GU10' | 'GX53';

export type DeliveryType = 'pickup' | 'courier';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'packing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type SortOption = 'priceAsc' | 'priceDesc' | 'nameAsc';

export type SortBy = 'price' | 'name';
export type SortDir = 'asc' | 'desc';

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategoryRef;
  price: number;
  stockQty: number;
  baseType: BaseType;
  wattage: number;
  colorTemperatureK: number;
  luminousFluxLm: number;
  isActive: boolean;
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ProductFiltersQuery {
  search?: string;
  categoryId?: number;
  baseType?: BaseType;
  wattage?: number;
  colorTemperatureK?: number;
  inStock?: boolean;
  sortBy?: SortBy;
  sortDir?: SortDir;
  page?: number;
  limit?: number;
}

export interface CartItemDto {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface CartDto {
  sessionId: string;
  items: CartItemDto[];
  total: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  baseType: BaseType;
  wattage: number;
  colorTemperatureK: number;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface OrderHistoryEntry {
  id: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: string;
  comment: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  sessionId: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryType: DeliveryType;
  address: string | null;
  comment: string | null;
  status: OrderStatus;
  itemsCount: number;
  total: number;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  sessionId: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryType: DeliveryType;
  address?: string;
  comment?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface InsufficientStockDetails {
  productId?: number;
  available: number;
  requested: number;
}

export interface AdminUser {
  id: number;
  login: string;
  fullName: string;
  role: 'admin';
}

export interface AdminLoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AdminUser;
}

export interface AdminProductImageInput {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}

export interface AdminProductCreateInput {
  sku: string;
  name: string;
  slug?: string;
  description: string;
  categoryId: number;
  price: number;
  stockQty: number;
  baseType: BaseType;
  wattage: number;
  colorTemperatureK: number;
  luminousFluxLm: number;
  isActive: boolean;
  images: AdminProductImageInput[];
}

export type AdminProductUpdateInput = Partial<AdminProductCreateInput>;
