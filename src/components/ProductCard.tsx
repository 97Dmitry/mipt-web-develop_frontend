import { Link } from 'react-router-dom';
import type { Product } from '../types/domain';
import { formatPrice } from '../utils/format';
import { ProductImage } from './ProductImage';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const outOfStock = product.stockQty === 0;
  return (
    <Link to={`/products/${product.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <ProductImage images={product.images} alt={product.name} className={styles.image} />
        {outOfStock && <div className={styles.badgeOos}>Нет в наличии</div>}
      </div>
      <div className={styles.body}>
        <div className={styles.specs}>
          {product.baseType} · {product.wattage} Вт · {product.colorTemperatureK}K
        </div>
        <div className={styles.name}>{product.name}</div>
        <div className={styles.footer}>
          <div className={styles.price}>{formatPrice(product.price)}</div>
          {!outOfStock && (
            <div className={styles.stock}>В наличии: {product.stockQty} шт.</div>
          )}
        </div>
      </div>
    </Link>
  );
}
