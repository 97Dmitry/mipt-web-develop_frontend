import type { CreateOrderInput, Order } from '../types/domain';
import { request } from './client';

export function createOrder(input: CreateOrderInput, signal?: AbortSignal): Promise<Order> {
  return request<Order>('POST', 'order', '/orders', { body: input, signal });
}

export function fetchOrderById(id: number, signal?: AbortSignal): Promise<Order> {
  return request<Order>('GET', 'order', `/orders/${id}`, { signal });
}
