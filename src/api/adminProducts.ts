import type {
  AdminCategoryInput,
  AdminProductCreateInput,
  AdminProductUpdateInput,
  Category,
  PageMeta,
  Product,
} from '../types/domain';
import { request, requestEnvelope } from './client';

interface ProductListQuery {
  search?: string;
  categoryId?: number;
  isActive?: boolean;
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
  const envelope = await requestEnvelope<Product[]>('GET', 'admin', '/catalog/products', {
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
  return request<Product>('GET', 'admin', `/catalog/products/${productId}`, {
    authToken: token,
    signal,
  });
}

export function createProduct(
  token: string,
  input: AdminProductCreateInput,
  signal?: AbortSignal,
): Promise<Product> {
  return request<Product>('POST', 'admin', '/catalog/products', {
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
  return request<Product>('PATCH', 'admin', `/catalog/products/${productId}`, {
    authToken: token,
    body: input,
    signal,
  });
}

export function deleteProduct(token: string, productId: number, signal?: AbortSignal): Promise<void> {
  return request<void>('DELETE', 'admin', `/catalog/products/${productId}`, {
    authToken: token,
    signal,
  });
}

export function updateProductStock(
  token: string,
  productId: number,
  stockQty: number,
  signal?: AbortSignal,
): Promise<{ id: number; stockQty: number }> {
  return request<{ id: number; stockQty: number }>('PATCH', 'admin', `/catalog/products/${productId}/stock`, {
    authToken: token,
    body: { stockQty },
    signal,
  });
}

export function listCategories(token: string, signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>('GET', 'admin', '/catalog/categories', {
    authToken: token,
    signal,
  });
}

export function createCategory(
  token: string,
  input: AdminCategoryInput,
  signal?: AbortSignal,
): Promise<Category> {
  return request<Category>('POST', 'admin', '/catalog/categories', {
    authToken: token,
    body: input,
    signal,
  });
}

export function updateCategory(
  token: string,
  categoryId: number,
  input: AdminCategoryInput,
  signal?: AbortSignal,
): Promise<Category> {
  return request<Category>('PATCH', 'admin', `/catalog/categories/${categoryId}`, {
    authToken: token,
    body: input,
    signal,
  });
}

export function deleteCategory(token: string, categoryId: number, signal?: AbortSignal): Promise<void> {
  return request<void>('DELETE', 'admin', `/catalog/categories/${categoryId}`, {
    authToken: token,
    signal,
  });
}
