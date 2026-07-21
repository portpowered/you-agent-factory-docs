/**
 * Format a USD amount for playground display.
 * Fixed fraction digits keep calc-wiring assertions stable across locales.
 */
export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "";
  }
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}
