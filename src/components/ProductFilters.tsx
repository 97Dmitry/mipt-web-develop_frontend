import type { BaseType, Category, ProductFiltersQuery, SortOption } from '../types/domain';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import styles from './ProductFilters.module.css';

export interface UiFilters extends Omit<ProductFiltersQuery, 'sortBy' | 'sortDir' | 'page' | 'limit'> {
  sortOption?: SortOption;
}

interface ProductFiltersProps {
  categories: Category[];
  filters: UiFilters;
  onChange: (next: UiFilters) => void;
  onReset: () => void;
}

const BASE_TYPES: BaseType[] = ['E27', 'E14', 'GU10', 'GX53'];
const WATTAGES = [5, 6, 7, 9, 11, 12, 15, 20, 40, 50, 60, 95];
const TEMPERATURES = [2700, 3000, 4000, 5000, 6500];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'nameAsc', label: 'По названию (А–Я)' },
];

export function ProductFiltersPanel({
  categories,
  filters,
  onChange,
  onReset,
}: ProductFiltersProps) {
  const update = (patch: Partial<UiFilters>) => onChange({ ...filters, ...patch });

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Фильтры</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Сбросить
        </Button>
      </div>

      <Input
        label="Поиск"
        placeholder="Название или артикул"
        value={filters.search ?? ''}
        onChange={(e) => update({ search: e.target.value })}
      />

      <Select
        label="Категория"
        placeholder="Все"
        value={filters.categoryId !== undefined ? String(filters.categoryId) : ''}
        options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        onChange={(e) =>
          update({ categoryId: e.target.value ? Number(e.target.value) : undefined })
        }
      />

      <Select
        label="Цоколь"
        placeholder="Любой"
        value={filters.baseType ?? ''}
        options={BASE_TYPES.map((b) => ({ value: b, label: b }))}
        onChange={(e) =>
          update({ baseType: (e.target.value as BaseType) || undefined })
        }
      />

      <Select
        label="Мощность"
        placeholder="Любая"
        value={filters.wattage !== undefined ? String(filters.wattage) : ''}
        options={WATTAGES.map((w) => ({ value: String(w), label: `${w} Вт` }))}
        onChange={(e) =>
          update({
            wattage: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />

      <Select
        label="Цветовая температура"
        placeholder="Любая"
        value={
          filters.colorTemperatureK !== undefined ? String(filters.colorTemperatureK) : ''
        }
        options={TEMPERATURES.map((t) => ({ value: String(t), label: `${t}K` }))}
        onChange={(e) =>
          update({
            colorTemperatureK: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />

      <div className={styles.checkboxRow}>
        <Checkbox
          label="Только в наличии"
          checked={filters.inStock ?? false}
          onChange={(e) => update({ inStock: e.target.checked || undefined })}
        />
      </div>

      <div className={styles.divider} />

      <Select
        label="Сортировка"
        placeholder="По умолчанию"
        value={filters.sortOption ?? ''}
        options={SORT_OPTIONS}
        onChange={(e) =>
          update({ sortOption: (e.target.value as SortOption) || undefined })
        }
      />
    </aside>
  );
}
