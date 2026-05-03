import { NavLink, Link } from 'react-router-dom';
import { CartBadge } from '../CartBadge';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo} aria-label="На главную">
          <span className={styles.logoIcon}>💡</span>
          <span className={styles.logoText}>Лампочки</span>
        </Link>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
          >
            Каталог
          </NavLink>
        </nav>

        <div className={styles.right}>
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
