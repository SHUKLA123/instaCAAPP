/**
 * All money crossing the API boundary is an int64 count of paise.
 * NEVER perform float arithmetic on money — only integer paise math,
 * and format at the very last moment for display.
 */
export type Paise = number;

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats an integer paise amount as a rupee string, e.g. 123450 -> "₹1,234.50".
 * Rounding never happens here — paise is already the smallest unit, division by
 * 100 for display is exact for any integer input.
 */
export function formatMoney(paise: Paise, opts?: {signed?: boolean; withSymbol?: boolean}): string {
  const withSymbol = opts?.withSymbol ?? true;
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const remainderPaise = abs % 100;
  const formatted = INR_FORMATTER.format(rupees + remainderPaise / 100);
  const sign = negative ? '-' : opts?.signed ? '+' : '';
  return `${sign}${withSymbol ? '₹' : ''}${formatted}`;
}

/** Formats paise as a compact per-minute rate, e.g. "₹47.20/min". */
export function formatRatePerMinute(paise: Paise): string {
  return `${formatMoney(paise)}/min`;
}

/** Adds a GST percentage on top of a base paise amount, rounding to the nearest paisa. */
export function applyGst(basePaise: Paise, gstRatePercent: number): Paise {
  return Math.round(basePaise * (1 + gstRatePercent / 100));
}

/** paise -> rupees as a plain number, for cases where an input control needs rupees. */
export function paiseToRupees(paise: Paise): number {
  return paise / 100;
}

/** rupees (possibly fractional, from a text input) -> integer paise, rounded. */
export function rupeesToPaise(rupees: number): Paise {
  return Math.round(rupees * 100);
}

export function sumPaise(values: readonly Paise[]): Paise {
  return values.reduce((acc, v) => acc + v, 0);
}
