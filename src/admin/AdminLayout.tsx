import { NavLink, Outlet } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import { useAdminAuth } from './useAdminAuth';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const { user, logout } = useAdminAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <div className={styles.brand}>Панель администратора</div>
          <nav className={styles.nav}>
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              Товары
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              Заказы
            </NavLink>
          </nav>
          <div className={styles.user}>
            <span>{user?.fullName ?? 'Администратор'}</span>
            <Button size="sm" variant="secondary" onClick={() => void handleLogout()}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
