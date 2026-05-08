import type { CartDto } from '../types/domain';
import { request } from './client';

export function getCart(sessionId: string, signal?: AbortSignal): Promise<CartDto> {
  return request<CartDto>('GET', 'order', `/cart/${encodeURIComponent(sessionId)}`, { signal });
}

export function addCartItem(
  sessionId: string,
  body: { productId: number; qty: number },
  signal?: AbortSignal,
): Promise<unknown> {
  return request<unknown>('POST', 'order', `/cart/${encodeURIComponent(sessionId)}/items`, {
    body,
    signal,
  });
}

export function updateCartItem(
  sessionId: string,
  itemId: number,
  body: { qty: number },
  signal?: AbortSignal,
): Promise<unknown> {
  return request<unknown>(
    'PATCH',
    'order',
    `/cart/${encodeURIComponent(sessionId)}/items/${itemId}`,
    { body, signal },
  );
}

export function removeCartItem(
  sessionId: string,
  itemId: number,
  signal?: AbortSignal,
): Promise<void> {
  return request<void>(
    'DELETE',
    'order',
    `/cart/${encodeURIComponent(sessionId)}/items/${itemId}`,
    { signal },
  );
}

export function clearCart(sessionId: string, signal?: AbortSignal): Promise<void> {
  return request<void>('DELETE', 'order', `/cart/${encodeURIComponent(sessionId)}`, { signal });
}
