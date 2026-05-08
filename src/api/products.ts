import type { Category, PageMeta, Product, ProductFiltersQuery } from '../types/domain';
import { request, requestEnvelope } from './client';

export function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>('GET', 'product', '/categories', { signal });
}

export interface ProductsListResult {
  items: Product[];
  meta: PageMeta;
}

export async function fetchProducts(
  filters: ProductFiltersQuery,
  signal?: AbortSignal,
): Promise<ProductsListResult> {
  const envelope = await requestEnvelope<Product[]>('GET', 'product', '/products', {
    query: {
      search: filters.search,
      categoryId: filters.categoryId,
      baseType: filters.baseType,
      wattage: filters.wattage,
      colorTemperatureK: filters.colorTemperatureK,
      inStock: filters.inStock,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: filters.page,
      limit: filters.limit,
    },
    signal,
  });
  const meta = (envelope.meta as PageMeta | undefined) ?? {
    page: 1,
    limit: envelope.data.length,
    total: envelope.data.length,
  };
  return { items: envelope.data, meta };
}

export function fetchProductById(id: number, signal?: AbortSignal): Promise<Product> {
  return request<Product>('GET', 'product', `/products/${id}`, { signal });
}
