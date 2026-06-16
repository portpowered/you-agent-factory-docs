import type { SharedShellMessageKey } from "@/types/localization";
import type { SharedShellMessages } from "../messages/en";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

/** Resolves a typed shared shell message key from a locale catalog. */
export function resolveMessage(
  catalog: SharedShellMessages,
  key: SharedShellMessageKey,
): string {
  const parts = key.split(".");
  let current: unknown = catalog;

  for (const part of parts) {
    if (!isRecord(current) || !(part in current)) {
      throw new Error(`Missing shared shell message key: ${key}`);
    }
    current = current[part];
  }

  if (typeof current !== "string") {
    throw new Error(
      `Shared shell message key does not resolve to text: ${key}`,
    );
  }

  return current;
}
