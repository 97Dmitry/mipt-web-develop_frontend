import type { Order, OrderStatus, PageMeta } from '../types/domain';
import { request, requestEnvelope } from './client';

interface OrdersListItem {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  status: OrderStatus;
  total: number;
  itemsCount: number;
  createdAt: string;
}

interface ListOrdersQuery {
  search?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface ListResult<T> {
  items: T[];
  meta: PageMeta;
}

export async function listOrders(
  token: string,
  query: ListOrdersQuery,
  signal?: AbortSignal,
): Promise<ListResult<OrdersListItem>> {
  const envelope = await requestEnvelope<OrdersListItem[]>('GET', 'order', '/admin/orders', {
    authToken: token,
    signal,
    query: query as QueryParams,
  });
  const meta = (envelope.meta as PageMeta | undefined) ?? {
    page: 1,
    limit: envelope.data.length,
    total: envelope.data.length,
  };
  return { items: envelope.data, meta };
}

export function getOrder(token: string, orderId: number, signal?: AbortSignal): Promise<Order> {
  return request<Order>('GET', 'order', `/admin/orders/${orderId}`, {
    authToken: token,
    signal,
  });
}

export function updateOrderStatus(
  token: string,
  orderId: number,
  status: OrderStatus,
  comment?: string,
  signal?: AbortSignal,
): Promise<{ id: number; status: OrderStatus }> {
  return request<{ id: number; status: OrderStatus }>('PATCH', 'order', `/admin/orders/${orderId}/status`, {
    authToken: token,
    signal,
    body: { status, comment },
  });
}
