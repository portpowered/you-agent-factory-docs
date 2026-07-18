/**
 * Page-local messages loader for the `/docs/workstations` family index.
 *
 * The W05 App Router owns the `/docs/workstations` URL (not a Fumadocs child
 * slug), so this index keeps messages/assets beside the workstations content
 * root without shipping a discoverable `workstations/<slug>/page.mdx` bundle
 * for the index itself.
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

export const WORKSTATIONS_FAMILY_INDEX_REGISTRY_ID =
  "documentation.workstations-family" as const;

export const WORKSTATIONS_FAMILY_INDEX_PATH = "/docs/workstations" as const;

export type WorkstationsFamilyIndexBundle = {
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

/** Absolute directory for the workstations family index messages/assets. */
export function getWorkstationsFamilyIndexDir(
  docsRoot = getDocsSectionRoot("workstations"),
): string {
  return docsRoot;
}

/**
 * Resolve page-local messages for a request locale.
 * Unshipped locales fall back to the default-locale messages file.
 */
export function resolveWorkstationsFamilyIndexMessagesLocale(
  locale: SiteLocale,
  pageDir = getWorkstationsFamilyIndexDir(),
): SiteLocale {
  if (locale === defaultLocale || hasPageMessagesFile(pageDir, locale)) {
    return locale;
  }
  return defaultLocale;
}

export async function loadWorkstationsFamilyIndexBundle(
  locale: SiteLocale = defaultLocale,
): Promise<WorkstationsFamilyIndexBundle> {
  const pageDir = getWorkstationsFamilyIndexDir();
  const messagesLocale = resolveWorkstationsFamilyIndexMessagesLocale(
    locale,
    pageDir,
  );
  const route = buildLocalizedRoute(
    { surface: "docs-page", slug: "workstations" },
    locale,
  );
  const messages = await loadPageMessages(pageDir, messagesLocale, { route });
  const assets = parsePageAssetConfig(
    readJsonFile(join(pageDir, "assets.json")),
  );

  return { messages, assets, locale, messagesLocale, route };
}
