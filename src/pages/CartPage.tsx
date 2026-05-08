import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearCart,
  clearCartError,
  clearInsufficientStock,
  loadCart,
  removeItem,
  updateItemQty,
} from '../store/slices/cartSlice';
import { Button } from '../components/ui/Button';
import { QuantityInput } from '../components/QuantityInput';
import { ProductImage } from '../components/ProductImage';
import { EmptyState } from '../components/EmptyState';
import { formatPrice } from '../utils/format';
import styles from './CartPage.module.css';

export function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const items = useAppSelector((s) => s.cart.items);
  const total = useAppSelector((s) => s.cart.total);
  const status = useAppSelector((s) => s.cart.status);
  const error = useAppSelector((s) => s.cart.error);
  const insufficient = useAppSelector((s) => s.cart.insufficientStock);
  const pendingOps = useAppSelector((s) => s.cart.pendingOps);

  if (status === 'error' && items === null) {
    return (
      <div className="container">
        <h1 style={{ marginBottom: 24 }}>Корзина</h1>
        <EmptyState
          icon="⚠️"
          title="Не удалось загрузить корзину"
          description={error?.message ?? 'Проверьте подключение и повторите попытку.'}
          action={<Button onClick={() => dispatch(loadCart())}>Повторить</Button>}
        />
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="container">
        <h1 style={{ marginBottom: 24 }}>Корзина</h1>
        <p>Загрузка…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container">
        <h1 style={{ marginBottom: 24 }}>Корзина</h1>
        <EmptyState
          icon="🛒"
          title="Корзина пуста"
          description="Загляните в каталог и выберите подходящие лампочки."
          action={<Button onClick={() => navigate('/')}>Перейти в каталог</Button>}
        />
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const clearing = Boolean(pendingOps['clear']);

  const handleClear = () => {
    dispatch(clearCart());
  };

  const handleQtyChange = (itemId: number, qty: number) => {
    dispatch(clearInsufficientStock());
    dispatch(updateItemQty({ itemId, qty }));
  };

  const handleRemove = (itemId: number) => {
    dispatch(removeItem({ itemId }));
  };

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>Корзина</h1>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={clearing}>
          {clearing ? 'Очищаем…' : 'Очистить'}
        </Button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>{error.message}</span>
          <button
            type="button"
            className={styles.errorClose}
            onClick={() => dispatch(clearCartError())}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
      )}

      {insufficient && (
        <div className={styles.warningBanner}>
          На складе доступно {insufficient.available} шт., запрошено{' '}
          {insufficient.requested}. Уменьшите количество.
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.list}>
          {items.map((line) => {
            const updating = Boolean(pendingOps[`update:${line.id}`]);
            const removing = Boolean(pendingOps[`remove:${line.id}`]);
            return (
              <div key={line.id} className={styles.row}>
                <Link to={`/products/${line.productId}`} className={styles.imageWrap}>
                  <ProductImage images={undefined} alt={line.productName} className={styles.image} />
                </Link>
                <div className={styles.info}>
                  <Link to={`/products/${line.productId}`} className={styles.name}>
                    {line.productName}
                  </Link>
                  <div className={styles.specs}>Артикул: {line.sku}</div>
                  <div className={styles.unitPrice}>{formatPrice(line.unitPrice)} за шт.</div>
                </div>
                <div className={styles.qtyCol}>
                  <QuantityInput
                    value={line.qty}
                    onChange={(next) => handleQtyChange(line.id, next)}
                    min={1}
                    max={99}
                    disabled={updating || removing}
                  />
                </div>
                <div className={styles.totalCol}>{formatPrice(line.lineTotal)}</div>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => handleRemove(line.id)}
                  disabled={removing}
                  aria-label="Удалить позицию"
                  title="Удалить"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <aside className={styles.summary}>
          <h3 className={styles.summaryTitle}>Итог</h3>
          <div className={styles.summaryRow}>
            <span className="muted">Товаров</span>
            <span>{totalItems} шт.</span>
          </div>
          <div className={styles.summaryRow}>
            <span className="muted">Сумма</span>
            <span className={styles.summaryTotal}>{formatPrice(total)}</span>
          </div>
          <Button fullWidth size="lg" onClick={() => navigate('/checkout')}>
            Оформить заказ
          </Button>
          <Link to="/" className={styles.continueLink}>
            Продолжить покупки
          </Link>
        </aside>
      </div>
    </div>
  );
}
