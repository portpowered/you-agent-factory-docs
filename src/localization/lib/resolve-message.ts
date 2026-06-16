import type {
  PartialSharedShellMessages,
  SharedShellMessageKey,
} from "@/types/localization";
import type { SharedShellMessages } from "../messages/en";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

type MessageCatalog = SharedShellMessages | PartialSharedShellMessages;

function walkMessagePath(
  catalog: MessageCatalog,
  key: SharedShellMessageKey,
): string | null {
  const parts = key.split(".");
  let current: unknown = catalog;

  for (const part of parts) {
    if (!isRecord(current) || !(part in current)) {
      return null;
    }
    current = current[part];
  }

  if (typeof current !== "string") {
    return null;
  }

  return current;
}

/** Resolves a typed shared shell message key from a locale catalog. */
export function resolveMessage(
  catalog: SharedShellMessages,
  key: SharedShellMessageKey,
): string {
  const value = walkMessagePath(catalog, key);
  if (value === null) {
    throw new Error(`Missing shared shell message key: ${key}`);
  }
  return value;
}

/** Resolves a key from an active catalog, falling back to the default locale catalog. */
export function resolveMessageWithFallback(
  catalog: MessageCatalog,
  fallbackCatalog: SharedShellMessages,
  key: SharedShellMessageKey,
): string {
  const value = walkMessagePath(catalog, key);
  if (value !== null) {
    return value;
  }
  return resolveMessage(fallbackCatalog, key);
}
