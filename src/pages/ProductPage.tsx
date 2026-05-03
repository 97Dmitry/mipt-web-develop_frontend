import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Category, Product } from '../types/domain';
import { getCategories, getProductById } from '../api/products';
import { useCart } from '../context/useCart';
import { Button } from '../components/ui/Button';
import { QuantityInput } from '../components/QuantityInput';
import { formatPrice, formatColorTemperature } from '../utils/format';
import styles from './ProductPage.module.css';

export function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    Promise.all([getProductById(productId), getCategories()]).then(([prod, cats]) => {
      if (cancelled) return;
      setProduct(prod);
      setCategory(prod ? cats.find((c) => c.id === prod.categoryId) ?? null : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="container">
        <p>Загрузка…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <h1>Товар не найден</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Возможно, товар был удалён или ссылка устарела.
        </p>
        <Link to="/" className={styles.back} style={{ marginTop: 16, display: 'inline-block' }}>
          ← Вернуться в каталог
        </Link>
      </div>
    );
  }

  const outOfStock = product.stockQty === 0;
  const handleAdd = () => {
    addItem(product.id, qty);
    navigate('/cart');
  };

  return (
    <div className="container">
      <Link to="/" className={styles.back}>
        ← Назад в каталог
      </Link>

      <div className={styles.layout}>
        <div className={styles.imageBox}>
          <img src={product.images[0]} alt={product.name} className={styles.image} />
          {outOfStock && <div className={styles.badgeOos}>Нет в наличии</div>}
        </div>

        <div className={styles.info}>
          {category && <div className={styles.category}>{category.name}</div>}
          <h1 className={styles.name}>{product.name}</h1>
          <div className={styles.sku}>Артикул: {product.sku}</div>

          <div className={styles.priceRow}>
            <div className={styles.price}>{formatPrice(product.priceMinor)}</div>
            <div className={outOfStock ? styles.stockOos : styles.stockOk}>
              {outOfStock ? 'Нет в наличии' : `В наличии: ${product.stockQty} шт.`}
            </div>
          </div>

          <h2 className={styles.specsTitle}>Характеристики</h2>
          <dl className={styles.specs}>
            <dt>Цоколь</dt>
            <dd>{product.baseType}</dd>
            <dt>Мощность</dt>
            <dd>{product.wattage} Вт</dd>
            <dt>Цветовая температура</dt>
            <dd>{formatColorTemperature(product.colorTemperatureK)}</dd>
            <dt>Световой поток</dt>
            <dd>{product.luminousFluxLm} лм</dd>
          </dl>

          <h2 className={styles.specsTitle}>Описание</h2>
          <p className={styles.description}>{product.description}</p>

          <div className={styles.actions}>
            <QuantityInput
              value={qty}
              onChange={setQty}
              min={1}
              max={Math.max(1, product.stockQty)}
              disabled={outOfStock}
            />
            <Button size="lg" onClick={handleAdd} disabled={outOfStock}>
              Добавить в корзину
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
