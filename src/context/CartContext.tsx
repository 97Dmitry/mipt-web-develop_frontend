import { useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { CartItem } from '../types/domain';
import { products } from '../data/products';
import { readJSON, writeJSON, getOrCreateSessionId } from '../utils/storage';
import { CartContext } from './cartContext';
import type { CartContextValue, CartLine } from './cartContext';

const CART_KEY = 'cart_v1';

type CartAction =
  | { type: 'ADD_ITEM'; productId: string; qty: number }
  | { type: 'UPDATE_QTY'; productId: string; qty: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'CLEAR' };

function reducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.productId === action.productId);
      if (existing) {
        return state.map((i) =>
          i.productId === action.productId ? { ...i, qty: i.qty + action.qty } : i,
        );
      }
      return [...state, { productId: action.productId, qty: action.qty }];
    }
    case 'UPDATE_QTY': {
      if (action.qty <= 0) {
        return state.filter((i) => i.productId !== action.productId);
      }
      return state.map((i) =>
        i.productId === action.productId ? { ...i, qty: action.qty } : i,
      );
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.productId !== action.productId);
    case 'CLEAR':
      return [];
  }
}

function init(): CartItem[] {
  return readJSON<CartItem[]>(CART_KEY) ?? [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    writeJSON(CART_KEY, items);
  }, [items]);

  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const lines = useMemo<CartLine[]>(() => {
    const result: CartLine[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      result.push({
        product,
        qty: item.qty,
        lineTotalMinor: product.priceMinor * item.qty,
      });
    }
    return result;
  }, [items]);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const totalPriceMinor = useMemo(
    () => lines.reduce((sum, l) => sum + l.lineTotalMinor, 0),
    [lines],
  );

  const value: CartContextValue = {
    items,
    lines,
    totalItems,
    totalPriceMinor,
    sessionId,
    addItem: (productId, qty = 1) => dispatch({ type: 'ADD_ITEM', productId, qty }),
    updateQty: (productId, qty) => dispatch({ type: 'UPDATE_QTY', productId, qty }),
    removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', productId }),
    clear: () => dispatch({ type: 'CLEAR' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
