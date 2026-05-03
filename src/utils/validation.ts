const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /\d/g;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = value.match(PHONE_DIGITS_RE)?.length ?? 0;
  return digits >= 10 && digits <= 11;
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
