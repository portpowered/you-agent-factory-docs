import type { TableRecord } from "@/lib/content/schemas";

/** Collects message keys referenced by a table registry record. */
export function collectTableMessageKeys(table: TableRecord): string[] {
  const keys = new Set<string>();

  for (const dimension of table.dimensions) {
    keys.add(dimension.labelKey);
  }

  for (const column of table.columns) {
    if (column.titleKey) {
      keys.add(column.titleKey);
    }
  }

  for (const valueKeys of Object.values(table.valueKeysByModuleId)) {
    for (const valueKey of Object.values(valueKeys)) {
      keys.add(valueKey);
    }
  }

  return [...keys];
}
