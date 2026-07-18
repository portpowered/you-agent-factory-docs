import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePageAssetConfig } from "@/lib/content/assets";
import { getDocsSectionRoot } from "@/lib/content/content-paths";
import { loadPageMessages } from "@/lib/content/page-messages-load";
import {
  type PageAssetConfig,
  type PageFrontmatter,
  type PageMessages,
  pageFrontmatterSchema,
} from "@/lib/content/schemas";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { REFERENCE_FAMILY_INDEX_REGISTRY_ID } from "./reference-family-routes";

export const REFERENCES_FAMILY_INDEX_DIR = join(
  getDocsSectionRoot("references"),
  "family-index",
);

export type LoadedReferencesFamilyIndex = {
  frontmatter: PageFrontmatter;
  messages: PageMessages;
  assets: PageAssetConfig;
  registryId: typeof REFERENCE_FAMILY_INDEX_REGISTRY_ID;
};

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/**
 * Loads the page-local references family index ownership surface.
 *
 * Default-locale (`en`) messages are required. Non-default locales fail closed
 * when that locale’s page messages are missing — no silent English fallback for
 * authored family-index prose (W17 collection/page chrome policy).
 */
export async function loadReferencesFamilyIndex(
  locale: SiteLocale = defaultLocale,
  indexDir = REFERENCES_FAMILY_INDEX_DIR,
): Promise<LoadedReferencesFamilyIndex> {
  const messages = await loadPageMessages(indexDir, locale, {
    route: "/docs/references",
  });
  const assets = parsePageAssetConfig(
    readJsonFile(join(indexDir, "assets.json")),
  );
  const frontmatter = pageFrontmatterSchema.parse(
    readJsonFile(join(indexDir, "frontmatter.json")),
  );

  if (frontmatter.registryId !== REFERENCE_FAMILY_INDEX_REGISTRY_ID) {
    throw new Error(
      `References family index frontmatter registryId "${frontmatter.registryId}" must be "${REFERENCE_FAMILY_INDEX_REGISTRY_ID}"`,
    );
  }

  return {
    frontmatter,
    messages,
    assets,
    registryId: REFERENCE_FAMILY_INDEX_REGISTRY_ID,
  };
}
