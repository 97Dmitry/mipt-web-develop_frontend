import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import * as adminOrdersApi from '../../api/adminOrders';
import { ApiError } from '../../api/client';
import { useAdminAuth } from '../../admin/useAdminAuth';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import type { Order, OrderStatus } from '../../types/domain';
import { formatPrice } from '../../utils/format';
import styles from './AdminOrderDetailPage.module.css';

const STATUSES: OrderStatus[] = ['new', 'confirmed', 'packing', 'shipped', 'completed', 'cancelled'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  confirmed: 'Подтвержден',
  packing: 'Собирается',
  shipped: 'Отправлен',
  completed: 'Выполнен',
  cancelled: 'Отменен',
};

const DELIVERY_LABELS: Record<Order['deliveryType'], string> = {
  pickup: 'Самовывоз',
  courier: 'Курьерская доставка',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminOrderDetailPage() {
  const { token } = useAdminAuth();
  const authToken = token;
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('new');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
    [],
  );

  useEffect(() => {
    if (!authToken || !Number.isFinite(orderId)) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const loaded = await adminOrdersApi.getOrder(authToken!, orderId);
        if (!cancelled) {
          setOrder(loaded);
          setStatusDraft(loaded.status);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Не удалось загрузить заказ');
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
  }, [authToken, orderId]);

  if (!authToken) return null;

  async function handleStatusUpdate() {
    if (!order) return;
    setSaving(true);
    setError(null);
    try {
      await adminOrdersApi.updateOrderStatus(authToken!, order.id, statusDraft, comment.trim() || undefined);
      const refreshed = await adminOrdersApi.getOrder(authToken!, order.id);
      setOrder(refreshed);
      setStatusDraft(refreshed.status);
      setComment('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось обновить статус');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!Number.isFinite(orderId)) {
    return (
      <section className={styles.page}>
        <h1>Заказ не найден</h1>
        <Link to="/admin/orders">Вернуться к заказам</Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <div>Загрузка...</div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className={styles.page}>
        <h1>Заказ не найден</h1>
        {error && <div className={styles.error}>{error}</div>}
        <Link to="/admin/orders">Вернуться к заказам</Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1>Заказ {order.orderNumber}</h1>
          <div className={styles.muted}>Создан {formatDate(order.createdAt)}</div>
        </div>
        <Link to="/admin/orders">К списку заказов</Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.layout}>
        <div className={styles.summary}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Позиции заказа</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Товар</th>
                  <th>Характеристики</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.sku}</td>
                    <td>{item.productName}</td>
                    <td>
                      {item.baseType}, {item.wattage} Вт, {item.colorTemperatureK}K
                    </td>
                    <td>{item.qty}</td>
                    <td>{formatPrice(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <strong>Итого: {formatPrice(order.total)}</strong>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>История статусов</h2>
            <ul className={styles.history}>
              {order.history.map((entry) => (
                <li className={styles.historyItem} key={entry.id}>
                  <div>
                    {entry.fromStatus ? STATUS_LABELS[entry.fromStatus] : 'Создание'} {'->'}{' '}
                    {STATUS_LABELS[entry.toStatus]}
                  </div>
                  <div className={styles.muted}>
                    {formatDate(entry.createdAt)} · {entry.changedBy}
                  </div>
                  {entry.comment && <div>{entry.comment}</div>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.summary}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Клиент</h2>
            <dl className={styles.dl}>
              <dt>Имя</dt>
              <dd>{order.customerName}</dd>
              <dt>Телефон</dt>
              <dd>{order.phone}</dd>
              <dt>Email</dt>
              <dd>{order.email}</dd>
              <dt>Получение</dt>
              <dd>{DELIVERY_LABELS[order.deliveryType]}</dd>
              {order.address && (
                <>
                  <dt>Адрес</dt>
                  <dd>{order.address}</dd>
                </>
              )}
              {order.comment && (
                <>
                  <dt>Комментарий</dt>
                  <dd>{order.comment}</dd>
                </>
              )}
            </dl>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Статус</h2>
            <div className={styles.statusForm}>
              <Select
                label="Новый статус"
                value={statusDraft}
                options={statusOptions}
                onChange={(event) => setStatusDraft(event.target.value as OrderStatus)}
              />
              <Textarea
                label="Комментарий"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
              />
              <Button onClick={() => void handleStatusUpdate()} disabled={saving || statusDraft === order.status}>
                {saving ? 'Обновляем...' : 'Обновить статус'}
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
