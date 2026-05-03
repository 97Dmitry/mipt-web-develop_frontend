import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BaseType, Category, Product, ProductFilters, SortOption } from '../types/domain';
import { getCategories, getProducts } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { ProductFiltersPanel } from '../components/ProductFilters';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/Button';
import styles from './CatalogPage.module.css';

const BASE_TYPES_SET = new Set<BaseType>(['E27', 'E14', 'GU10', 'G9', 'G4']);
const SORT_SET = new Set<SortOption>(['priceAsc', 'priceDesc', 'nameAsc']);

function parseFiltersFromSearch(params: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {};

  const search = params.get('search');
  if (search) filters.search = search;

  const categoryId = params.get('categoryId');
  if (categoryId) filters.categoryId = categoryId;

  const baseType = params.get('baseType');
  if (baseType && BASE_TYPES_SET.has(baseType as BaseType)) {
    filters.baseType = baseType as BaseType;
  }

  const wattage = params.get('wattage');
  if (wattage && !Number.isNaN(Number(wattage))) {
    filters.wattage = Number(wattage);
  }

  const temp = params.get('colorTemperatureK');
  if (temp && !Number.isNaN(Number(temp))) {
    filters.colorTemperatureK = Number(temp);
  }

  if (params.get('inStock') === '1') {
    filters.inStock = true;
  }

  const sortBy = params.get('sortBy');
  if (sortBy && SORT_SET.has(sortBy as SortOption)) {
    filters.sortBy = sortBy as SortOption;
  }

  return filters;
}

function filtersToSearchInit(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.baseType) params.set('baseType', filters.baseType);
  if (filters.wattage !== undefined) params.set('wattage', String(filters.wattage));
  if (filters.colorTemperatureK !== undefined)
    params.set('colorTemperatureK', String(filters.colorTemperatureK));
  if (filters.inStock) params.set('inStock', '1');
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  return params;
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useMemo(() => parseFiltersFromSearch(searchParams), [searchParams]);

  useEffect(() => {
    let cancelled = false;
    getCategories().then((cats) => {
      if (!cancelled) setCategories(cats);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getProducts(filters).then((list) => {
      if (cancelled) return;
      setItems(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const handleFiltersChange = (next: ProductFilters) => {
    setSearchParams(filtersToSearchInit(next), { replace: true });
  };

  const handleReset = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>Каталог</h1>
        <div className={styles.count}>{loading ? 'Загрузка…' : `Найдено: ${items.length}`}</div>
      </div>

      <div className={styles.layout}>
        <ProductFiltersPanel
          categories={categories}
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleReset}
        />

        <div className={styles.results}>
          {!loading && items.length === 0 && (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте изменить параметры поиска или сбросить фильтры."
              action={<Button onClick={handleReset}>Сбросить фильтры</Button>}
            />
          )}

          {items.length > 0 && (
            <div className={styles.grid}>
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
