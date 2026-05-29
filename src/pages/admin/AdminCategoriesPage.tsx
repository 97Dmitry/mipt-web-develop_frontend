import { useEffect, useState, type FormEvent } from 'react';

import * as adminProductsApi from '../../api/adminProducts';
import { ApiError } from '../../api/client';
import { useAdminAuth } from '../../admin/useAdminAuth';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import type { AdminCategoryInput, Category } from '../../types/domain';
import styles from './AdminCategoriesPage.module.css';

interface FormState {
  id: number | null;
  name: string;
  slug: string;
  sortOrder: string;
  isActive: boolean;
}

const initialForm: FormState = {
  id: null,
  name: '',
  slug: '',
  sortOrder: '0',
  isActive: true,
};

function toPayload(form: FormState): AdminCategoryInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || undefined,
    sort_order: Number(form.sortOrder) || 0,
    is_active: form.isActive,
  };
}

export function AdminCategoriesPage() {
  const { token } = useAdminAuth();
  const authToken = token;
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const categories = await adminProductsApi.listCategories(authToken!);
        if (!cancelled) {
          setItems(categories);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Не удалось загрузить категории');
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
  }, [authToken]);

  if (!authToken) return null;

  function editCategory(category: Category) {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Введите название категории');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      if (form.id === null) {
        const created = await adminProductsApi.createCategory(authToken!, payload);
        setItems((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
      } else {
        const updated = await adminProductsApi.updateCategory(authToken!, form.id, payload);
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      }
      setForm(initialForm);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось сохранить категорию');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoryId: number) {
    if (!window.confirm('Удалить категорию? Если к ней привязаны товары, backend вернет ошибку.')) return;
    try {
      await adminProductsApi.deleteCategory(authToken!, categoryId);
      setItems((prev) => prev.filter((item) => item.id !== categoryId));
      if (form.id === categoryId) {
        setForm(initialForm);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось удалить категорию');
      }
    }
  }

  return (
    <section className={styles.page}>
      <h1>Категории</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Название"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
          placeholder="slug сгенерируется автоматически"
        />
        <Input
          label="Порядок"
          type="number"
          value={form.sortOrder}
          onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
        />
        <Checkbox
          label="Активна"
          checked={form.isActive}
          onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
        />
        <Button type="submit" disabled={saving}>
          {saving ? 'Сохраняем...' : form.id === null ? 'Создать' : 'Сохранить'}
        </Button>
        {form.id !== null && (
          <Button type="button" variant="secondary" onClick={() => setForm(initialForm)}>
            Отмена
          </Button>
        )}
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Slug</th>
              <th>Порядок</th>
              <th>Активна</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6}>Нет категорий</td>
              </tr>
            )}
            {items.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.sortOrder}</td>
                <td>{category.isActive ? 'Да' : 'Нет'}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" onClick={() => editCategory(category)}>
                      Редактировать
                    </button>
                    <button type="button" onClick={() => void handleDelete(category.id)}>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={6}>Загрузка...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
