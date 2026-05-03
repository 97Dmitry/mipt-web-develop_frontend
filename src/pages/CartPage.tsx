import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { Button } from '../components/ui/Button';
import { QuantityInput } from '../components/QuantityInput';
import { EmptyState } from '../components/EmptyState';
import { formatPrice } from '../utils/format';
import styles from './CartPage.module.css';

export function CartPage() {
  const { lines, totalItems, totalPriceMinor, updateQty, removeItem, clear } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="container">
        <h1 style={{ marginBottom: 24 }}>Корзина</h1>
        <EmptyState
          icon="🛒"
          title="Корзина пуста"
          description="Загляните в каталог и выберите подходящие лампочки."
          action={
            <Button onClick={() => navigate('/')}>Перейти в каталог</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>Корзина</h1>
        <Button variant="ghost" size="sm" onClick={clear}>
          Очистить
        </Button>
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {lines.map(({ product, qty, lineTotalMinor }) => (
            <div key={product.id} className={styles.row}>
              <Link to={`/products/${product.id}`} className={styles.imageWrap}>
                <img src={product.images[0]} alt={product.name} className={styles.image} />
              </Link>
              <div className={styles.info}>
                <Link to={`/products/${product.id}`} className={styles.name}>
                  {product.name}
                </Link>
                <div className={styles.specs}>
                  {product.baseType} · {product.wattage} Вт · {product.colorTemperatureK}K
                </div>
                <div className={styles.unitPrice}>{formatPrice(product.priceMinor)} за шт.</div>
              </div>
              <div className={styles.qtyCol}>
                <QuantityInput
                  value={qty}
                  onChange={(next) => updateQty(product.id, next)}
                  min={1}
                  max={Math.max(1, product.stockQty)}
                />
              </div>
              <div className={styles.totalCol}>{formatPrice(lineTotalMinor)}</div>
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeItem(product.id)}
                aria-label="Удалить позицию"
                title="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className={styles.summary}>
          <h3 className={styles.summaryTitle}>Итог</h3>
          <div className={styles.summaryRow}>
            <span className="muted">Товаров</span>
            <span>{totalItems} шт.</span>
          </div>
          <div className={styles.summaryRow}>
            <span className="muted">Сумма</span>
            <span className={styles.summaryTotal}>{formatPrice(totalPriceMinor)}</span>
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
