export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

export function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export function isValidPan(pan: string): boolean {
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(pan.trim().toUpperCase());
}

export function isValidGstin(gstin: string): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/.test(gstin.trim().toUpperCase());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isNonEmpty(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
