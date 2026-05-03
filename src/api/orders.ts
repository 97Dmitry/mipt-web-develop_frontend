import type { CreateOrderInput, Order, OrderItemSnapshot } from '../types/domain';
import { products } from '../data/products';
import { getOrCreateSessionId, readJSON, writeJSON } from '../utils/storage';

const ORDERS_KEY = 'orders_v1';

function loadOrders(): Order[] {
  return readJSON<Order[]>(ORDERS_KEY) ?? [];
}

function saveOrders(orders: Order[]): void {
  writeJSON(ORDERS_KEY, orders);
}

function buildOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0');
  return `LMP-${ts}-${rnd}`;
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  if (input.items.length === 0) {
    return Promise.reject(new Error('Корзина пуста'));
  }

  const snapshots: OrderItemSnapshot[] = [];
  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return Promise.reject(new Error(`Товар ${item.productId} не найден`));
    }
    if (product.stockQty < item.qty) {
      return Promise.reject(
        new Error(`Недостаточно товара "${product.name}" на складе (есть ${product.stockQty})`),
      );
    }
    snapshots.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      baseType: product.baseType,
      wattage: product.wattage,
      colorTemperatureK: product.colorTemperatureK,
      unitPriceMinor: product.priceMinor,
      qty: item.qty,
      lineTotalMinor: product.priceMinor * item.qty,
    });
  }

  const totalMinor = snapshots.reduce((sum, s) => sum + s.lineTotalMinor, 0);

  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: buildOrderNumber(),
    sessionId: getOrCreateSessionId(),
    customerName: input.customerName,
    phone: input.phone,
    email: input.email,
    deliveryType: input.deliveryType,
    address: input.address,
    comment: input.comment,
    status: 'new',
    items: snapshots,
    totalMinor,
    createdAt: new Date().toISOString(),
  };

  const orders = loadOrders();
  orders.push(order);
  saveOrders(orders);

  return Promise.resolve(order);
}

export function getOrderById(id: string): Promise<Order | null> {
  const order = loadOrders().find((o) => o.id === id) ?? null;
  return Promise.resolve(order);
}
