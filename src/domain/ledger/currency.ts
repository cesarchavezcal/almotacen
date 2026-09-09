/**
 * Domain Currency Utilities (Integer Cent Arithmetic)
 *
 * Adheres to Section 6: Integer cents, no floating-point currency drift.
 */

/**
 * Parses user currency input string (e.g. "$42.50", "100", "0.99") into integer cents.
 * Disallows negative values and invalid characters. Returns 0 for invalid/empty inputs.
 */
export function parseCurrencyToCents(amountStr: string): number {
  if (!amountStr) return 0;
  const trimmed = amountStr.trim();
  if (trimmed.startsWith('-') || trimmed.includes('-')) return 0;
  const cleaned = trimmed.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100);
}

/**
 * Formats integer cents into a localized USD currency string ($X.XX).
 */
export function formatCentsToCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}
