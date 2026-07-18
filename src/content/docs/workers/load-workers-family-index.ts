/**
 * Page-local messages loader for the `/docs/workers` family index.
 *
 * The W05 App Router owns the `/docs/workers` URL (not a Fumadocs child slug),
 * so this index keeps messages/assets beside the workers content root without
 * shipping a discoverable `workers/<slug>/page.mdx` bundle for the index itself.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePageAssetConfig } from "@/lib/content/assets";
import { getDocsSectionRoot } from "@/lib/content/content-paths";
import {
  hasPageMessagesFile,
  loadPageMessages,
} from "@/lib/content/page-messages-load";
import type { PageAssetConfig, PageMessages } from "@/lib/content/schemas";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";

export const WORKERS_FAMILY_INDEX_REGISTRY_ID =
  "documentation.workers-family" as const;

export const WORKERS_FAMILY_INDEX_PATH = "/docs/workers" as const;

export type WorkersFamilyIndexBundle = {
  messages: PageMessages;
  assets: PageAssetConfig;
  locale: SiteLocale;
  /** Locale whose message file was loaded (may fall back to `en`). */
  messagesLocale: SiteLocale;
  route: string;
};

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/** Absolute directory for the workers family index messages/assets. */
export function getWorkersFamilyIndexDir(
  docsRoot = getDocsSectionRoot("workers"),
): string {
  return docsRoot;
}

/**
 * Resolve page-local messages for a request locale.
 * Unshipped locales fall back to the default-locale messages file.
 */
export function resolveWorkersFamilyIndexMessagesLocale(
  locale: SiteLocale,
  pageDir = getWorkersFamilyIndexDir(),
): SiteLocale {
  if (locale === defaultLocale || hasPageMessagesFile(pageDir, locale)) {
    return locale;
  }
  return defaultLocale;
}

export async function loadWorkersFamilyIndexBundle(
  locale: SiteLocale = defaultLocale,
): Promise<WorkersFamilyIndexBundle> {
  const pageDir = getWorkersFamilyIndexDir();
  const messagesLocale = resolveWorkersFamilyIndexMessagesLocale(
    locale,
    pageDir,
  );
  const route = buildLocalizedRoute(
    { surface: "docs-page", slug: "workers" },
    locale,
  );
  const messages = await loadPageMessages(pageDir, messagesLocale, { route });
  const assets = parsePageAssetConfig(
    readJsonFile(join(pageDir, "assets.json")),
  );

  return { messages, assets, locale, messagesLocale, route };
}
