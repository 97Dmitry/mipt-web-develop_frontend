import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearCurrentProduct,
  fetchProductById,
} from '../store/slices/productsSlice';
import { addItem, clearInsufficientStock } from '../store/slices/cartSlice';
import { Button } from '../components/ui/Button';
import { QuantityInput } from '../components/QuantityInput';
import { ProductImage } from '../components/ProductImage';
import { formatPrice, formatColorTemperature } from '../utils/format';
import styles from './ProductPage.module.css';

export function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const product = useAppSelector((s) => s.products.currentProduct);
  const status = useAppSelector((s) => s.products.currentProductStatus);
  const error = useAppSelector((s) => s.products.currentProductError);
  const insufficient = useAppSelector((s) => s.cart.insufficientStock);
  const adding = useAppSelector(
    (s) => product !== null && Boolean(s.cart.pendingOps[`add:${product.id}`]),
  );

  const [qty, setQty] = useState(1);
  const idAsNumber = Number(productId);
  const isValidId = productId !== undefined && !Number.isNaN(idAsNumber);

  useEffect(() => {
    if (!isValidId) return;
    dispatch(fetchProductById(idAsNumber));
    return () => {
      dispatch(clearCurrentProduct());
      dispatch(clearInsufficientStock());
    };
  }, [dispatch, isValidId, idAsNumber]);

  if (!isValidId || status === 'notFound') {
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

  if (status === 'error') {
    return (
      <div className="container">
        <h1>Не удалось загрузить товар</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          {error?.message ?? 'Проверьте подключение и повторите попытку.'}
        </p>
        <Button
          style={{ marginTop: 16 }}
          onClick={() => dispatch(fetchProductById(idAsNumber))}
        >
          Повторить
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <p>Загрузка…</p>
      </div>
    );
  }

  const outOfStock = product.stockQty === 0;

  const handleAdd = async () => {
    const result = await dispatch(addItem({ productId: product.id, qty }));
    if (addItem.fulfilled.match(result)) {
      navigate('/cart');
    }
  };

  const showInsufficient =
    insufficient !== null && insufficient.productId === product.id;

  return (
    <div className="container">
      <Link to="/" className={styles.back}>
        ← Назад в каталог
      </Link>

      <div className={styles.layout}>
        <div className={styles.imageBox}>
          <ProductImage images={product.images} alt={product.name} className={styles.image} />
          {outOfStock && <div className={styles.badgeOos}>Нет в наличии</div>}
        </div>

        <div className={styles.info}>
          <div className={styles.category}>{product.category.name}</div>
          <h1 className={styles.name}>{product.name}</h1>
          <div className={styles.sku}>Артикул: {product.sku}</div>

          <div className={styles.priceRow}>
            <div className={styles.price}>{formatPrice(product.price)}</div>
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

          {showInsufficient && (
            <div className={styles.errorBanner}>
              На складе доступно {insufficient.available} шт., запрошено{' '}
              {insufficient.requested}.
            </div>
          )}

          <div className={styles.actions}>
            <QuantityInput
              value={qty}
              onChange={setQty}
              min={1}
              max={Math.max(1, product.stockQty)}
              disabled={outOfStock}
            />
            <Button size="lg" onClick={handleAdd} disabled={outOfStock || adding}>
              {adding ? 'Добавляем…' : 'Добавить в корзину'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
