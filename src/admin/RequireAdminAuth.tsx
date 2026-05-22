import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAdminAuth } from './useAdminAuth';

export function RequireAdminAuth() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return <div className="container" style={{ padding: '40px 24px' }}>Проверка сессии...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
