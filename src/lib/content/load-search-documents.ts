import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadStarterContentRecords } from "@/lib/content/load-starter-content";
import { resolveLocaleFileName } from "@/lib/content/locale-files";
import type { LocalizedContentVariantBinding } from "@/lib/content/localized-variant-identity";
import {
  type LocalizedSearchDocument,
  generateLocalizedSearchDocuments,
} from "@/lib/content/search-document";
import {
  STARTER_CONTENT_DIRECTORY_KINDS,
  type StarterContentDirectory,
} from "@/lib/content/starter";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import type { PublicContentKind } from "@/lib/content/types";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");

const DIRECTORY_BY_KIND = Object.fromEntries(
  Object.entries(STARTER_CONTENT_DIRECTORY_KINDS).map(([directory, kind]) => [
    kind,
    directory,
  ]),
) as Record<PublicContentKind, StarterContentDirectory>;

function parseContentPathKey(contentPathKey: string): {
  kind: PublicContentKind;
  slug: string;
} {
  const separatorIndex = contentPathKey.indexOf("/");
  if (separatorIndex <= 0 || separatorIndex === contentPathKey.length - 1) {
    throw new Error(`Invalid content path key: ${contentPathKey}`);
  }

  const kind = contentPathKey.slice(0, separatorIndex) as PublicContentKind;
  const slug = contentPathKey.slice(separatorIndex + 1);
  return { kind, slug };
}

function readVariantSource(
  contentRoot: string,
  binding: LocalizedContentVariantBinding,
): string {
  const { kind, slug } = parseContentPathKey(binding.contentPathKey);
  const contentDirectory = DIRECTORY_BY_KIND[kind];
  const slugRoot = join(contentRoot, contentDirectory, slug);
  const localeFile = resolveLocaleFileName(
    binding.variantLocale,
    readdirSync(slugRoot),
  );

  if (!localeFile) {
    throw new Error(
      `Localized search source not found for "${binding.contentPathKey}" locale "${binding.variantLocale}"`,
    );
  }

  return readFileSync(join(slugRoot, localeFile), "utf8");
}

/**
 * Loads starter content fixtures and projects one normalized localized search
 * document per validated locale-specific variant binding.
 */
export function loadLocalizedSearchDocuments(
  contentRoot = DEFAULT_CONTENT_ROOT,
): LocalizedSearchDocument[] {
  const { failures, variantBindings } = loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  return generateLocalizedSearchDocuments(variantBindings, (binding) =>
    readVariantSource(contentRoot, binding),
  );
}
