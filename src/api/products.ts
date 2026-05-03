import type { Category, Product, ProductFilters } from '../types/domain';
import { categories } from '../data/categories';
import { products } from '../data/products';

export function getCategories(): Promise<Category[]> {
  return Promise.resolve(categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
}

export function getProductById(id: string): Promise<Product | null> {
  return Promise.resolve(products.find((p) => p.id === id) ?? null);
}

export function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let result = products.filter((p) => p.isActive);

  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );
    }
  }
  if (filters.categoryId) {
    result = result.filter((p) => p.categoryId === filters.categoryId);
  }
  if (filters.baseType) {
    result = result.filter((p) => p.baseType === filters.baseType);
  }
  if (filters.wattage !== undefined) {
    result = result.filter((p) => p.wattage === filters.wattage);
  }
  if (filters.colorTemperatureK !== undefined) {
    result = result.filter((p) => p.colorTemperatureK === filters.colorTemperatureK);
  }
  if (filters.inStock) {
    result = result.filter((p) => p.stockQty > 0);
  }

  switch (filters.sortBy) {
    case 'priceAsc':
      result = [...result].sort((a, b) => a.priceMinor - b.priceMinor);
      break;
    case 'priceDesc':
      result = [...result].sort((a, b) => b.priceMinor - a.priceMinor);
      break;
    case 'nameAsc':
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      break;
    default:
      break;
  }

  return Promise.resolve(result);
}
