import { createContext } from 'react';
import type { CartItem, Product } from '../types/domain';

export interface CartLine {
  product: Product;
  qty: number;
  lineTotalMinor: number;
}

export interface CartContextValue {
  items: CartItem[];
  lines: CartLine[];
  totalItems: number;
  totalPriceMinor: number;
  sessionId: string;
  addItem: (productId: string, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
