/**
 * Format unknown schema values for code-style display and clipboard copy.
 * Pure — no IO. Uses JSON serialization so defaults stay copyable literals.
 */

export function formatSchemaValue(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
