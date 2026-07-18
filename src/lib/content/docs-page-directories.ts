import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Discovers docs page-bundle directories under a docs root.
 *
 * A page bundle is any directory that contains `page.mdx`. Discovery continues
 * under directories that already have a page so nested child pages
 * (`<section>/<…>/<child>/page.mdx`) are found instead of stopping after the
 * first two path segments.
 */
export function findDocsPageDirectories(rootDir: string): string[] {
  if (!existsSync(rootDir)) {
    return [];
  }

  const directories: string[] = [];

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const pageDir = join(rootDir, entry.name);
    const pageMdx = join(pageDir, "page.mdx");
    if (existsSync(pageMdx)) {
      directories.push(pageDir);
    }

    directories.push(...findDocsPageDirectories(pageDir));
  }

  return directories;
}
