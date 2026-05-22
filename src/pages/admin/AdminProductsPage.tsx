import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import * as adminProductsApi from '../../api/adminProducts';
import { ApiError } from '../../api/client';
import { useAdminAuth } from '../../admin/useAdminAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatPrice } from '../../utils/format';
import type { Product } from '../../types/domain';
import styles from './AdminProductsPage.module.css';

export function AdminProductsPage() {
  const { token } = useAdminAuth();
  const authToken = token;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await adminProductsApi.listProducts(authToken!, { search, page: 1, limit: 100 });
        if (!cancelled) {
          setItems(response.items);
          setTotal(response.meta.total);
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
  }, [authToken, search]);

  if (!authToken) {
    return null;
  }

  async function handleDelete(productId: number) {
    if (!window.confirm('Деактивировать товар?')) return;
    try {
      await adminProductsApi.deleteProduct(authToken!, productId);
      setItems((prev) => prev.filter((item) => item.id !== productId));
      setTotal((prev) => Math.max(0, prev - 1));
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
        <div>
          <Button type="submit" variant="secondary" size="sm">
            Найти
          </Button>
          {' '}
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
              <th>Цена</th>
              <th>Остаток</th>
              <th>Активен</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7}>Нет данных</td>
              </tr>
            )}
            {items.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td>{formatPrice(product.price)}</td>
                <td>{product.stockQty}</td>
                <td>{product.isActive ? 'Да' : 'Нет'}</td>
                <td>
                  <div className={styles.actions}>
                    <Link to={`/admin/products/${product.id}/edit`}>Редактировать</Link>
                    <button type="button" onClick={() => void handleDelete(product.id)}>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={7}>Загрузка...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
