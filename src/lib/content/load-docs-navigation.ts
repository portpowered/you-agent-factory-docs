import { join } from "node:path";
import type { DocsShellNavigationInput } from "@/lib/content/docs-navigation";
import { loadDocsStructureSource } from "@/lib/content/docs-structure-source";
import { withCodePresentationExampleNavigation } from "@/lib/docs-primitives";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");

/**
 * Loads starter content fixtures and projects the first docs-shell navigation input.
 */
export function loadDocsShellNavigation(
  contentRoot = DEFAULT_CONTENT_ROOT,
  options?: { locale?: string },
): DocsShellNavigationInput {
  return withCodePresentationExampleNavigation(
    loadDocsStructureSource(contentRoot, options).docsRouteNavigation,
  );
}
