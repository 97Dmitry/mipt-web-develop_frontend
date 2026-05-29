import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import * as adminProductsApi from '../../api/adminProducts';
import { ApiError } from '../../api/client';
import { useAdminAuth } from '../../admin/useAdminAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatPrice } from '../../utils/format';
import type { Category, Product } from '../../types/domain';
import styles from './AdminProductsPage.module.css';

type ActiveFilter = 'all' | 'active' | 'inactive';

export function AdminProductsPage() {
  const { token } = useAdminAuth();
  const authToken = token;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: String(category.id), label: category.name })),
    [categories],
  );

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [productsResponse, loadedCategories] = await Promise.all([
          adminProductsApi.listProducts(authToken!, {
            search,
            categoryId: categoryFilter ? Number(categoryFilter) : undefined,
            isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
            page: 1,
            limit: 100,
          }),
          adminProductsApi.listCategories(authToken!),
        ]);
        if (!cancelled) {
          setItems(productsResponse.items);
          setCategories(loadedCategories);
          setTotal(productsResponse.meta.total);
          setStockDrafts(
            Object.fromEntries(productsResponse.items.map((item) => [item.id, String(item.stockQty)])),
          );
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Не удалось загрузить товары');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken, search, categoryFilter, activeFilter]);

  if (!authToken) {
    return null;
  }

  async function handleDelete(productId: number) {
    if (!window.confirm('Деактивировать товар?')) return;
    try {
      await adminProductsApi.deleteProduct(authToken!, productId);
      setItems((prev) =>
        activeFilter === 'active'
          ? prev.filter((item) => item.id !== productId)
          : prev.map((item) => (item.id === productId ? { ...item, isActive: false } : item)),
      );
      if (activeFilter === 'active') {
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось удалить товар');
      }
    }
  }

  async function handleStockUpdate(productId: number) {
    const nextStock = Number(stockDrafts[productId]);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setError('Остаток должен быть целым числом не меньше 0');
      return;
    }

    try {
      const response = await adminProductsApi.updateProductStock(authToken!, productId, nextStock);
      setItems((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, stockQty: response.stockQty } : item)),
      );
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось обновить остаток');
      }
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <section className={styles.page}>
      <h1>Товары</h1>

      <form className={styles.toolbar} onSubmit={handleSubmit}>
        <Input
          className={styles.search}
          label="Поиск по SKU или названию"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Например, LED"
        />
        <Select
          label="Категория"
          value={categoryFilter}
          options={categoryOptions}
          placeholder="Все"
          onChange={(event) => setCategoryFilter(event.target.value)}
        />
        <Select
          label="Активность"
          value={activeFilter}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'active', label: 'Активные' },
            { value: 'inactive', label: 'Неактивные' },
          ]}
          onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
        />
        <div className={styles.toolbarActions}>
          <Button type="submit" variant="secondary" size="sm">
            Найти
          </Button>
          <Link to="/admin/products/new">Новый товар</Link>
        </div>
      </form>

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.meta}>Найдено: {total}</div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Активен</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8}>Нет данных</td>
              </tr>
            )}
            {items.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td>{product.category.name}</td>
                <td>{formatPrice(product.price)}</td>
                <td>
                  <div className={styles.stockEditor}>
                    <input
                      type="number"
                      min="0"
                      value={stockDrafts[product.id] ?? String(product.stockQty)}
                      onChange={(event) =>
                        setStockDrafts((prev) => ({ ...prev, [product.id]: event.target.value }))
                      }
                    />
                    <button type="button" onClick={() => void handleStockUpdate(product.id)}>
                      OK
                    </button>
                  </div>
                </td>
                <td>{product.isActive ? 'Да' : 'Нет'}</td>
                <td>
                  <div className={styles.actions}>
                    <Link to={`/admin/products/${product.id}/edit`}>Редактировать</Link>
                    <button type="button" onClick={() => void handleDelete(product.id)}>
                      Деактивировать
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={8}>Загрузка...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
