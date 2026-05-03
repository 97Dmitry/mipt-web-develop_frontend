import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Order } from '../types/domain';
import { getOrderById } from '../api/orders';
import { Button } from '../components/ui/Button';
import { formatPrice } from '../utils/format';
import styles from './OrderConfirmationPage.module.css';

const STATUS_LABELS: Record<Order['status'], string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  packing: 'Собирается',
  shipped: 'Отправлен',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

const DELIVERY_LABELS: Record<Order['deliveryType'], string> = {
  pickup: 'Самовывоз',
  courier: 'Курьерская доставка',
};

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    getOrderById(orderId).then((found) => {
      if (cancelled) return;
      setOrder(found);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="container">
        <p>Загрузка…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <h1>Заказ не найден</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Возможно, ссылка устарела или заказ был удалён.
        </p>
        <Link to="/" style={{ marginTop: 16, display: 'inline-block' }}>
          ← Вернуться в каталог
        </Link>
      </div>
    );
  }

  const createdAt = new Date(order.createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container">
      <div className={styles.heroCard}>
        <div className={styles.heroIcon}>✓</div>
        <h1 className={styles.heroTitle}>Спасибо за заказ!</h1>
        <p className={styles.heroDesc}>
          Заказ <strong>{order.orderNumber}</strong> принят. Мы свяжемся с вами для подтверждения.
        </p>
        <div className={styles.heroMeta}>
          <span className={styles.statusBadge}>{STATUS_LABELS[order.status]}</span>
          <span className="subtle">{createdAt}</span>
        </div>
      </div>

      <div className={styles.layout}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Состав заказа</h2>
          <ul className={styles.items}>
            {order.items.map((item) => (
              <li key={item.productId} className={styles.item}>
                <div>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemSpecs}>
                    {item.baseType} · {item.wattage} Вт · {item.colorTemperatureK}K · артикул{' '}
                    {item.sku}
                  </div>
                </div>
                <div className={styles.itemRight}>
                  <div className={styles.itemQty}>
                    {item.qty} × {formatPrice(item.unitPriceMinor)}
                  </div>
                  <div className={styles.itemTotal}>{formatPrice(item.lineTotalMinor)}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.totalRow}>
            <span>Итого</span>
            <span className={styles.totalAmount}>{formatPrice(order.totalMinor)}</span>
          </div>
        </section>

        <aside className={styles.sideCol}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Контактные данные</h2>
            <dl className={styles.dl}>
              <dt>Имя</dt>
              <dd>{order.customerName}</dd>
              <dt>Телефон</dt>
              <dd>{order.phone}</dd>
              <dt>Email</dt>
              <dd>{order.email}</dd>
            </dl>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Доставка</h2>
            <dl className={styles.dl}>
              <dt>Способ</dt>
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

          <Link to="/" className={styles.continueLink}>
            <Button variant="secondary" fullWidth>
              Вернуться в каталог
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
