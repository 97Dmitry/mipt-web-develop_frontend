import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>💡 Лампочки</div>
        <div className={styles.copy}>© {year}. Учебный проект, MIPT Web Development.</div>
      </div>
    </footer>
  );
}
