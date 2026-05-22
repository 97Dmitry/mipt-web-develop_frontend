import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAdminAuth } from '../../admin/useAdminAuth';
import styles from './AdminLoginPage.module.css';

interface LocationState {
  from?: string;
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAdminAuth();
  const [loginValue, setLoginValue] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = location.state as LocationState | null;

  if (isAuthenticated) {
    return <Navigate to="/admin/products" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(loginValue.trim(), password);
      navigate(state?.from && state.from.startsWith('/admin') ? state.from : '/admin/products', {
        replace: true,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось выполнить вход');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Вход в админ-панель</h1>
        {error && <div className={styles.error}>{error}</div>}
        <Input
          label="Логин"
          value={loginValue}
          onChange={(event) => {
            setLoginValue(event.target.value);
            setError(null);
          }}
          autoComplete="username"
          required
        />
        <Input
          label="Пароль"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          autoComplete="current-password"
          required
        />
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Входим...' : 'Войти'}
        </Button>
      </form>
    </div>
  );
}
