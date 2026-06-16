import { join } from "node:path";
import {
  type DocsShellNavigationInput,
  projectDocsShellNavigation,
} from "@/lib/content/docs-navigation";
import { loadStarterContentRecords } from "@/lib/content/load-starter-content";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");

/**
 * Loads starter content fixtures and projects the first docs-shell navigation input.
 */
export function loadDocsShellNavigation(
  contentRoot = DEFAULT_CONTENT_ROOT,
  options?: { locale?: string },
): DocsShellNavigationInput {
  const { records, failures, variantBindings } =
    loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);
  return projectDocsShellNavigation(records, {
    ...options,
    variantBindings,
  });
}
