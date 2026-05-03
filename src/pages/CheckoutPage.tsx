import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DeliveryType } from '../types/domain';
import { useCart } from '../context/useCart';
import { createOrder } from '../api/orders';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { isValidEmail, isValidPhone, isNonEmpty } from '../utils/validation';
import { formatPrice } from '../utils/format';
import styles from './CheckoutPage.module.css';

interface FormState {
  customerName: string;
  phone: string;
  email: string;
  deliveryType: DeliveryType;
  address: string;
  comment: string;
}

interface FormErrors {
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const INITIAL: FormState = {
  customerName: '',
  phone: '',
  email: '',
  deliveryType: 'pickup',
  address: '',
  comment: '',
};

export function CheckoutPage() {
  const { lines, totalItems, totalPriceMinor, clear } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (lines.length === 0 && !submitting) {
      navigate('/cart', { replace: true });
    }
  }, [lines.length, submitting, navigate]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!isNonEmpty(form.customerName)) next.customerName = 'Введите имя';
    if (!isNonEmpty(form.phone)) next.phone = 'Введите телефон';
    else if (!isValidPhone(form.phone)) next.phone = 'Телефон должен содержать 10–11 цифр';
    if (!isNonEmpty(form.email)) next.email = 'Введите email';
    else if (!isValidEmail(form.email)) next.email = 'Некорректный формат email';
    if (form.deliveryType === 'courier' && !isNonEmpty(form.address)) {
      next.address = 'Укажите адрес доставки';
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const order = await createOrder({
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        deliveryType: form.deliveryType,
        address: form.deliveryType === 'courier' ? form.address.trim() : undefined,
        comment: form.comment.trim() || undefined,
        items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
      });
      clear();
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Не удалось оформить заказ');
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: 24 }}>Оформление заказа</h1>

      <form className={styles.layout} onSubmit={handleSubmit} noValidate>
        <div className={styles.formColumn}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Контактные данные</h2>
            <Input
              label="Имя и фамилия"
              placeholder="Иван Иванов"
              value={form.customerName}
              onChange={(e) => update('customerName', e.target.value)}
              error={errors.customerName}
              autoComplete="name"
              required
            />
            <Input
              label="Телефон"
              placeholder="+7 999 123-45-67"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              error={errors.phone}
              autoComplete="tel"
              type="tel"
              required
            />
            <Input
              label="Email"
              placeholder="ivan@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              error={errors.email}
              autoComplete="email"
              type="email"
              required
            />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Способ получения</h2>
            <div className={styles.radioGroup}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="deliveryType"
                  value="pickup"
                  checked={form.deliveryType === 'pickup'}
                  onChange={() => update('deliveryType', 'pickup')}
                />
                <div className={styles.radioBody}>
                  <div className={styles.radioTitle}>Самовывоз</div>
                  <div className={styles.radioDesc}>Из пункта выдачи. Бесплатно.</div>
                </div>
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="deliveryType"
                  value="courier"
                  checked={form.deliveryType === 'courier'}
                  onChange={() => update('deliveryType', 'courier')}
                />
                <div className={styles.radioBody}>
                  <div className={styles.radioTitle}>Курьерская доставка</div>
                  <div className={styles.radioDesc}>На указанный адрес.</div>
                </div>
              </label>
            </div>

            {form.deliveryType === 'courier' && (
              <Input
                label="Адрес доставки"
                placeholder="Город, улица, дом, квартира"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                error={errors.address}
                autoComplete="street-address"
                required
              />
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Комментарий к заказу</h2>
            <Textarea
              label="Дополнительная информация (необязательно)"
              placeholder="Например, удобное время для звонка"
              value={form.comment}
              onChange={(e) => update('comment', e.target.value)}
            />
          </section>

          {serverError && <div className={styles.serverError}>{serverError}</div>}
        </div>

        <aside className={styles.summary}>
          <h3 className={styles.summaryTitle}>Ваш заказ</h3>
          <ul className={styles.itemsList}>
            {lines.map(({ product, qty, lineTotalMinor }) => (
              <li key={product.id} className={styles.summaryItem}>
                <div className={styles.itemName}>
                  {product.name}
                  <span className={styles.itemQty}> × {qty}</span>
                </div>
                <div className={styles.itemTotal}>{formatPrice(lineTotalMinor)}</div>
              </li>
            ))}
          </ul>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryRow}>
            <span className="muted">Товаров</span>
            <span>{totalItems} шт.</span>
          </div>
          <div className={styles.summaryRow}>
            <span className="muted">Итого</span>
            <span className={styles.summaryTotal}>{formatPrice(totalPriceMinor)}</span>
          </div>
          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'Отправка…' : 'Оформить заказ'}
          </Button>
          <Link to="/cart" className={styles.backLink}>
            ← Вернуться в корзину
          </Link>
        </aside>
      </form>
    </div>
  );
}
