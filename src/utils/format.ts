export function formatPrice(minor: number): string {
  const rubles = minor / 100;
  const formatted = rubles.toLocaleString('ru-RU', {
    minimumFractionDigits: rubles % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ₽`;
}

export function formatColorTemperature(k: number): string {
  if (k <= 3000) return `${k}K · тёплый`;
  if (k <= 4500) return `${k}K · нейтральный`;
  return `${k}K · холодный`;
}
