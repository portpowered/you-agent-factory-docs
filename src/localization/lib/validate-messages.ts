import type {
  PartialSharedShellMessages,
  SharedShellMessageKey,
} from "@/types/localization";
import { DEFAULT_LOCALE } from "../config/default-locale";
import { SUPPORTED_LOCALES, type SupportedLocale } from "../config/locales";
import {
  type SharedShellMessages,
  enMessages,
  getMessageCatalog,
} from "../messages";
import { resolveLocale } from "./resolve-locale";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

export type MessageValidationIssue = {
  locale?: SupportedLocale;
  key?: string;
  message: string;
};

export type MessageValidationResult = {
  valid: boolean;
  issues: MessageValidationIssue[];
};

function walkMessagePath(
  catalog: unknown,
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

/** Collects dot-separated leaf keys from a shared shell message tree. */
export function collectSharedShellMessageKeys(
  tree: SharedShellMessages,
): SharedShellMessageKey[] {
  const keys: SharedShellMessageKey[] = [];

  function walk(node: Record<string, unknown>, prefix = ""): void {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "string") {
        keys.push(path as SharedShellMessageKey);
      } else if (isRecord(value)) {
        walk(value, path);
      }
    }
  }

  walk(tree as Record<string, unknown>);
  return keys;
}

/** Validates that the default-locale catalog defines every required shared shell key. */
export function validateDefaultLocaleMessages(
  catalog: unknown,
  reference: SharedShellMessages = enMessages,
): MessageValidationResult {
  const issues: MessageValidationIssue[] = [];

  if (!isRecord(catalog)) {
    return {
      valid: false,
      issues: [
        {
          message: "Default locale catalog must be an object",
        },
      ],
    };
  }

  for (const key of collectSharedShellMessageKeys(reference)) {
    const value = walkMessagePath(catalog, key);
    if (value === null) {
      issues.push({
        key,
        message: `Missing required shared shell message key: ${key}`,
      });
      continue;
    }

    if (value.trim() === "") {
      issues.push({
        key,
        message: `Shared shell message key must be a non-empty string: ${key}`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

function validatePartialShape(
  partial: unknown,
  reference: unknown,
  path: string,
  issues: MessageValidationIssue[],
  locale?: SupportedLocale,
): void {
  if (partial === undefined || partial === null) {
    return;
  }

  if (typeof reference === "string") {
    if (typeof partial !== "string") {
      issues.push({
        locale,
        key: path,
        message: `Expected string at ${path}, received ${typeof partial}`,
      });
      return;
    }

    if (partial.trim() === "") {
      issues.push({
        locale,
        key: path,
        message: `Shared shell message key must be a non-empty string: ${path}`,
      });
    }
    return;
  }

  if (!isRecord(reference)) {
    return;
  }

  if (!isRecord(partial)) {
    issues.push({
      locale,
      key: path || undefined,
      message: `Expected object at ${path || "catalog root"}, received ${typeof partial}`,
    });
    return;
  }

  for (const [key, refValue] of Object.entries(reference)) {
    const childPath = path ? `${path}.${key}` : key;
    if (key in partial) {
      validatePartialShape(partial[key], refValue, childPath, issues, locale);
    }
  }

  for (const key of Object.keys(partial)) {
    if (!(key in reference)) {
      issues.push({
        locale,
        key: path ? `${path}.${key}` : key,
        message: `Unknown shared shell message key: ${path ? `${path}.${key}` : key}`,
      });
    }
  }
}

/** Validates a partial locale catalog against the shared shell message contract shape. */
export function validatePartialLocaleMessages(
  catalog: unknown,
  reference: SharedShellMessages = enMessages,
  locale?: SupportedLocale,
): MessageValidationResult {
  const issues: MessageValidationIssue[] = [];

  if (catalog === undefined || catalog === null) {
    return { valid: true, issues };
  }

  if (!isRecord(catalog)) {
    return {
      valid: false,
      issues: [
        {
          locale,
          message: "Locale catalog must be an object when provided",
        },
      ],
    };
  }

  validatePartialShape(catalog, reference, "", issues, locale);
  return { valid: issues.length === 0, issues };
}

/** Validates every registered shared shell catalog used by the message path. */
export function validateRegisteredMessageCatalogs(): MessageValidationResult {
  const issues: MessageValidationIssue[] = [];

  for (const locale of SUPPORTED_LOCALES) {
    const catalog = getMessageCatalog(locale);
    const result =
      locale === DEFAULT_LOCALE
        ? validateDefaultLocaleMessages(catalog)
        : validatePartialLocaleMessages(
            catalog as PartialSharedShellMessages,
            enMessages,
            locale,
          );

    for (const issue of result.issues) {
      issues.push({ locale, ...issue });
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Throws when registered catalogs fail validation; intended for automated checks. */
export function assertValidRegisteredMessageCatalogs(): void {
  const result = validateRegisteredMessageCatalogs();
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => {
      const localePrefix = issue.locale ? `[${issue.locale}] ` : "";
      const keyPrefix = issue.key ? `${issue.key}: ` : "";
      return `${localePrefix}${keyPrefix}${issue.message}`;
    })
    .join("\n");

  throw new Error(`Shared shell message validation failed:\n${details}`);
}

/** Validates unsupported locale inputs normalize before catalog lookup. */
export function validateUnsupportedLocaleResolution(
  input: string | undefined | null,
): MessageValidationResult {
  const resolution = resolveLocale(input);
  const catalog = getMessageCatalog(resolution.locale);
  const defaultValidation = validateDefaultLocaleMessages(catalog);

  if (!defaultValidation.valid) {
    return {
      valid: false,
      issues: defaultValidation.issues.map((issue) => ({
        ...issue,
        message: `Unsupported locale resolution broke fallback catalog: ${issue.message}`,
      })),
    };
  }

  return { valid: true, issues: [] };
}
