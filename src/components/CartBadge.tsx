import { Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import styles from './CartBadge.module.css';

export function CartBadge() {
  const totalItems = useAppSelector((s) =>
    (s.cart.items ?? []).reduce((sum, item) => sum + item.qty, 0),
  );
  return (
    <Link to="/cart" className={styles.link} aria-label={`Корзина: ${totalItems} шт.`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className={styles.label}>Корзина</span>
      {totalItems > 0 && <span className={styles.counter}>{totalItems}</span>}
    </Link>
  );
}
