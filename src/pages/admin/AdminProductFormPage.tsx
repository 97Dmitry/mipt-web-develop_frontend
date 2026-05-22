import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import * as adminProductsApi from '../../api/adminProducts';
import { ApiError } from '../../api/client';
import { useAdminAuth } from '../../admin/useAdminAuth';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import type { AdminProductCreateInput, BaseType, Category } from '../../types/domain';
import styles from './AdminProductFormPage.module.css';

const BASE_TYPES: BaseType[] = ['E27', 'E14', 'GU10', 'GX53'];

interface ProductFormState {
  sku: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  stockQty: string;
  baseType: BaseType;
  wattage: string;
  colorTemperatureK: string;
  luminousFluxLm: string;
  isActive: boolean;
  imageUrl: string;
  imageAlt: string;
}

const initialState: ProductFormState = {
  sku: '',
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  price: '0',
  stockQty: '0',
  baseType: 'E27',
  wattage: '0',
  colorTemperatureK: '0',
  luminousFluxLm: '0',
  isActive: true,
  imageUrl: '',
  imageAlt: '',
};

function toNumber(value: string): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function AdminProductFormPage() {
  const { token } = useAdminAuth();
  const authToken = token;
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const isEdit = Boolean(params.id);
  const [form, setForm] = useState<ProductFormState>(initialState);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: String(category.id), label: category.name })),
    [categories],
  );

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const loadedCategories = await adminProductsApi.listCategories(authToken!);
        if (cancelled) return;

        setCategories(loadedCategories);
        if (!isEdit) {
          setForm((prev) => ({
            ...prev,
            categoryId: loadedCategories[0] ? String(loadedCategories[0].id) : '',
          }));
          return;
        }

        const productId = Number(params.id);
        if (!Number.isFinite(productId)) {
          throw new Error('Некорректный ID товара');
        }
        const product = await adminProductsApi.getProduct(authToken!, productId);
        if (cancelled) return;

        setForm({
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: String(product.category.id),
          price: String(product.price),
          stockQty: String(product.stockQty),
          baseType: product.baseType,
          wattage: String(product.wattage),
          colorTemperatureK: String(product.colorTemperatureK),
          luminousFluxLm: String(product.luminousFluxLm),
          isActive: product.isActive,
          imageUrl: product.images[0]?.imageUrl ?? '',
          imageAlt: product.images[0]?.altText ?? '',
        });
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Не удалось загрузить форму товара');
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
  }, [authToken, isEdit, params.id]);

  if (!authToken) return null;

  function updateField<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: AdminProductCreateInput = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      categoryId: toNumber(form.categoryId),
      price: toNumber(form.price),
      stockQty: toNumber(form.stockQty),
      baseType: form.baseType,
      wattage: toNumber(form.wattage),
      colorTemperatureK: toNumber(form.colorTemperatureK),
      luminousFluxLm: toNumber(form.luminousFluxLm),
      isActive: form.isActive,
      images: form.imageUrl.trim()
        ? [
            {
              imageUrl: form.imageUrl.trim(),
              altText: form.imageAlt.trim() || undefined,
              sortOrder: 0,
            },
          ]
        : [],
    };

    try {
      if (isEdit) {
        const productId = Number(params.id);
        if (!Number.isFinite(productId)) {
          throw new Error('Некорректный ID товара');
        }
        await adminProductsApi.updateProduct(authToken!, productId, payload);
      } else {
        await adminProductsApi.createProduct(authToken!, payload);
      }
      navigate('/admin/products');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось сохранить товар');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <h1>{isEdit ? 'Редактирование товара' : 'Новый товар'}</h1>
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <Input label="SKU" value={form.sku} onChange={(event) => updateField('sku', event.target.value)} required />
            <Input label="Название" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
            <Input label="Slug" value={form.slug} onChange={(event) => updateField('slug', event.target.value)} />
            <Select
              label="Категория"
              options={categoryOptions}
              value={form.categoryId}
              onChange={(event) => updateField('categoryId', event.target.value)}
              required
            />
            <Input
              label="Цена (копейки)"
              type="number"
              value={form.price}
              onChange={(event) => updateField('price', event.target.value)}
              required
            />
            <Input
              label="Остаток"
              type="number"
              value={form.stockQty}
              onChange={(event) => updateField('stockQty', event.target.value)}
              required
            />
            <Select
              label="Цоколь"
              options={BASE_TYPES.map((value) => ({ value, label: value }))}
              value={form.baseType}
              onChange={(event) => updateField('baseType', event.target.value as BaseType)}
            />
            <Input
              label="Мощность (Вт)"
              type="number"
              value={form.wattage}
              onChange={(event) => updateField('wattage', event.target.value)}
              required
            />
            <Input
              label="Температура (K)"
              type="number"
              value={form.colorTemperatureK}
              onChange={(event) => updateField('colorTemperatureK', event.target.value)}
              required
            />
            <Input
              label="Световой поток (лм)"
              type="number"
              value={form.luminousFluxLm}
              onChange={(event) => updateField('luminousFluxLm', event.target.value)}
              required
            />
            <Input
              label="URL изображения"
              value={form.imageUrl}
              onChange={(event) => updateField('imageUrl', event.target.value)}
            />
            <Input
              label="Alt изображения"
              value={form.imageAlt}
              onChange={(event) => updateField('imageAlt', event.target.value)}
            />
          </div>

          <Textarea
            label="Описание"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={4}
            required
          />

          <Checkbox
            label="Товар активен"
            checked={form.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
          />

          <div className={styles.actions}>
            <Button type="submit" disabled={saving}>
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </Button>
            <Link to="/admin/products">Отмена</Link>
          </div>
        </form>
      )}
    </section>
  );
}
