import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import * as adminOrdersApi from '../../api/adminOrders';
import { ApiError } from '../../api/client';
import { useAdminAuth } from '../../admin/useAdminAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { OrderStatus } from '../../types/domain';
import { formatPrice } from '../../utils/format';
import styles from './AdminOrdersPage.module.css';

interface StatusDrafts {
  [orderId: number]: OrderStatus;
}

const STATUSES: OrderStatus[] = ['new', 'confirmed', 'packing', 'shipped', 'completed', 'cancelled'];

export function AdminOrdersPage() {
  const { token } = useAdminAuth();
  const authToken = token;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Awaited<ReturnType<typeof adminOrdersApi.listOrders>>['items']>([]);
  const [total, setTotal] = useState(0);
  const [statusDrafts, setStatusDrafts] = useState<StatusDrafts>({});

  const statusOptions = useMemo(
    () => STATUSES.map((status) => ({ value: status, label: status })),
    [],
  );

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await adminOrdersApi.listOrders(authToken!, {
          search,
          status: statusFilter || undefined,
          dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
          dateTo: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined,
          page: 1,
          limit: 100,
        });
        if (cancelled) return;

        setItems(response.items);
        setTotal(response.meta.total);
        setStatusDrafts(
          Object.fromEntries(response.items.map((item) => [item.id, item.status])) as StatusDrafts,
        );
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Не удалось загрузить заказы');
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
  }, [authToken, search, statusFilter, dateFrom, dateTo]);

  if (!authToken) return null;

  function handleFilterSubmit(event: FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  async function handleUpdateStatus(orderId: number) {
    const nextStatus = statusDrafts[orderId];
    if (!nextStatus) return;

    try {
      await adminOrdersApi.updateOrderStatus(authToken!, orderId, nextStatus);
      setItems((prev) => prev.map((item) => (item.id === orderId ? { ...item, status: nextStatus } : item)));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось обновить статус');
      }
    }
  }

  return (
    <section className={styles.page}>
      <h1>Заказы</h1>

      <form className={styles.toolbar} onSubmit={handleFilterSubmit}>
        <Input
          label="Поиск по номеру, телефону или email"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <Select
          label="Статус"
          value={statusFilter}
          options={statusOptions}
          placeholder="Все"
          onChange={(event) => setStatusFilter(event.target.value as OrderStatus | '')}
        />
        <Input
          label="Дата от"
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <Input
          label="Дата до"
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm">
          Применить
        </Button>
      </form>

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.meta}>Найдено: {total}</div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Номер</th>
              <th>Дата</th>
              <th>Клиент</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={9}>Нет заказов</td>
              </tr>
            )}

            {items.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  <Link to={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>{order.customerName}</td>
                <td>{order.phone}</td>
                <td>{order.email}</td>
                <td>{formatPrice(order.total)}</td>
                <td>{order.status}</td>
                <td>
                  <div className={styles.rowActions}>
                    <select
                      value={statusDrafts[order.id] ?? order.status}
                      onChange={(event) =>
                        setStatusDrafts((prev) => ({
                          ...prev,
                          [order.id]: event.target.value as OrderStatus,
                        }))
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => void handleUpdateStatus(order.id)}>
                      Обновить
                    </button>
                    <Link to={`/admin/orders/${order.id}`}>Открыть</Link>
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={9}>Загрузка...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
