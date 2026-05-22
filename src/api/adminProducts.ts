import type {
  AdminProductCreateInput,
  AdminProductUpdateInput,
  Category,
  PageMeta,
  Product,
} from '../types/domain';
import { request, requestEnvelope } from './client';

interface ProductListQuery {
  search?: string;
  page?: number;
  limit?: number;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface ListResult<T> {
  items: T[];
  meta: PageMeta;
}

export async function listProducts(
  token: string,
  query: ProductListQuery,
  signal?: AbortSignal,
): Promise<ListResult<Product>> {
  const envelope = await requestEnvelope<Product[]>('GET', 'product', '/products', {
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

export function getProduct(token: string, productId: number, signal?: AbortSignal): Promise<Product> {
  return request<Product>('GET', 'product', `/products/${productId}`, {
    authToken: token,
    signal,
  });
}

export function createProduct(
  token: string,
  input: AdminProductCreateInput,
  signal?: AbortSignal,
): Promise<Product> {
  return request<Product>('POST', 'product', '/products', {
    authToken: token,
    body: input,
    signal,
  });
}

export function updateProduct(
  token: string,
  productId: number,
  input: AdminProductUpdateInput,
  signal?: AbortSignal,
): Promise<Product> {
  return request<Product>('PATCH', 'product', `/products/${productId}`, {
    authToken: token,
    body: input,
    signal,
  });
}

export function deleteProduct(token: string, productId: number, signal?: AbortSignal): Promise<void> {
  return request<void>('DELETE', 'product', `/products/${productId}`, {
    authToken: token,
    signal,
  });
}

export function listCategories(token: string, signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>('GET', 'product', '/categories', {
    authToken: token,
    signal,
  });
}
