import styles from './QuantityInput.module.css';

interface QuantityInputProps {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: QuantityInputProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={styles.wrapper} data-disabled={disabled || undefined}>
      <button
        type="button"
        className={styles.btn}
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Уменьшить"
      >
        −
      </button>
      <input
        type="number"
        className={styles.input}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const next = Number.parseInt(e.target.value, 10);
          if (Number.isNaN(next)) return;
          onChange(Math.max(min, Math.min(max, next)));
        }}
      />
      <button
        type="button"
        className={styles.btn}
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Увеличить"
      >
        +
      </button>
    </div>
  );
}
