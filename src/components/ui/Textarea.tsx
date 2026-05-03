import type { TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={[styles.textarea, error ? styles.textareaError : ''].filter(Boolean).join(' ')}
        {...rest}
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
