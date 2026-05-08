import { useState } from 'react';
import type { ProductImage as ProductImageDto } from '../types/domain';

const PLACEHOLDER = '/placeholder-bulb.svg';

interface ProductImageProps {
  images: ProductImageDto[] | undefined;
  alt: string;
  className?: string;
}

export function ProductImage({ images, alt, className }: ProductImageProps) {
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);
  const url = images?.[0]?.imageUrl ?? PLACEHOLDER;
  const finalUrl = erroredUrl === url ? PLACEHOLDER : url;

  return (
    <img
      src={finalUrl}
      alt={images?.[0]?.altText ?? alt}
      className={className}
      onError={() => {
        if (finalUrl !== PLACEHOLDER) setErroredUrl(url);
      }}
    />
  );
}
