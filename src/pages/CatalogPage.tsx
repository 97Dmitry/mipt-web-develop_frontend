import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  BaseType,
  ProductFiltersQuery,
  SortBy,
  SortDir,
  SortOption,
} from '../types/domain';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCategories, fetchProducts } from '../store/slices/productsSlice';
import { ProductCard } from '../components/ProductCard';
import { ProductFiltersPanel } from '../components/ProductFilters';
import type { UiFilters } from '../components/ProductFilters';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/Button';
import styles from './CatalogPage.module.css';

const BASE_TYPES_SET = new Set<BaseType>(['E27', 'E14', 'GU10', 'GX53']);
const SORT_SET = new Set<SortOption>(['priceAsc', 'priceDesc', 'nameAsc']);

function parseFiltersFromSearch(params: URLSearchParams): UiFilters {
  const filters: UiFilters = {};

  const search = params.get('search');
  if (search) filters.search = search;

  const categoryId = params.get('categoryId');
  if (categoryId && !Number.isNaN(Number(categoryId))) {
    filters.categoryId = Number(categoryId);
  }

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
    filters.sortOption = sortBy as SortOption;
  }

  return filters;
}

function filtersToSearch(filters: UiFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.categoryId !== undefined) params.set('categoryId', String(filters.categoryId));
  if (filters.baseType) params.set('baseType', filters.baseType);
  if (filters.wattage !== undefined) params.set('wattage', String(filters.wattage));
  if (filters.colorTemperatureK !== undefined)
    params.set('colorTemperatureK', String(filters.colorTemperatureK));
  if (filters.inStock) params.set('inStock', '1');
  if (filters.sortOption) params.set('sortBy', filters.sortOption);
  return params;
}

function sortOptionToQuery(option: SortOption | undefined): {
  sortBy?: SortBy;
  sortDir?: SortDir;
} {
  switch (option) {
    case 'priceAsc':
      return { sortBy: 'price', sortDir: 'asc' };
    case 'priceDesc':
      return { sortBy: 'price', sortDir: 'desc' };
    case 'nameAsc':
      return { sortBy: 'name', sortDir: 'asc' };
    default:
      return {};
  }
}

function uiFiltersToQuery(filters: UiFilters): ProductFiltersQuery {
  const { sortOption, ...rest } = filters;
  return { ...rest, ...sortOptionToQuery(sortOption), limit: 24 };
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.products.categories);
  const list = useAppSelector((s) => s.products.list);
  const meta = useAppSelector((s) => s.products.listMeta);
  const status = useAppSelector((s) => s.products.listStatus);
  const error = useAppSelector((s) => s.products.listError);

  const filters = useMemo(() => parseFiltersFromSearch(searchParams), [searchParams]);
  const queryString = searchParams.toString();

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const promise = dispatch(fetchProducts(uiFiltersToQuery(filters)));
    return () => {
      promise.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, queryString]);

  const handleFiltersChange = (next: UiFilters) => {
    setSearchParams(filtersToSearch(next), { replace: true });
  };

  const handleReset = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const loading = status === 'loading' || status === 'idle';
  const total = meta?.total ?? list.length;

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>Каталог</h1>
        <div className={styles.count}>
          {loading ? 'Загрузка…' : `Найдено: ${total}`}
        </div>
      </div>

      <div className={styles.layout}>
        <ProductFiltersPanel
          categories={categories}
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleReset}
        />

        <div className={styles.results}>
          {status === 'error' && (
            <EmptyState
              icon="⚠️"
              title="Не удалось загрузить каталог"
              description={error?.message ?? 'Проверьте подключение и повторите попытку.'}
              action={
                <Button onClick={() => dispatch(fetchProducts(uiFiltersToQuery(filters)))}>
                  Повторить
                </Button>
              }
            />
          )}

          {status === 'success' && list.length === 0 && (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте изменить параметры поиска или сбросить фильтры."
              action={<Button onClick={handleReset}>Сбросить фильтры</Button>}
            />
          )}

          {list.length > 0 && (
            <div className={styles.grid}>
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
