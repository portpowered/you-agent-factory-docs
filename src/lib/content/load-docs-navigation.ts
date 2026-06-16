import { join } from "node:path";
import {
  type DocsShellNavigationInput,
  projectDocsShellNavigation,
} from "@/lib/content/docs-navigation";
import { requireStarterContentRecords } from "@/lib/content/load-starter-content";
import { withCodePresentationExampleNavigation } from "@/lib/docs-primitives";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");

/**
 * Loads starter content fixtures and projects the first docs-shell navigation input.
 */
export function loadDocsShellNavigation(
  contentRoot = DEFAULT_CONTENT_ROOT,
  options?: { locale?: string },
): DocsShellNavigationInput {
  const records = requireStarterContentRecords(contentRoot);
  return withCodePresentationExampleNavigation(
    projectDocsShellNavigation(records, options),
  );
}
