/**
 * Every message key an MDX docs page references must survive the page-messages
 * schema and resolve to a non-empty string in every locale that ships one.
 *
 * This catches a silent failure mode: `pageMessagesSchema` is a plain
 * `z.object`, so an authored top-level namespace it does not declare (a
 * `matrix` or `steps` block, say) is stripped at load time. The page still
 * renders — the unresolved `<T>` returns null outside dev — so the section
 * simply comes out blank with no error anywhere.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DOCS_ROOT } from "@/lib/content/content-paths";
import { lookupMessage } from "@/lib/content/messages";
import { pageMessagesSchema } from "@/lib/content/schemas";
import { supportedLocales } from "@/lib/i18n/locale-routing";

function findDocsPageFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...findDocsPageFiles(entryPath));
    } else if (entry.name === "page.mdx") {
      found.push(entryPath);
    }
  }
  return found;
}

/**
 * Message keys referenced from MDX: `<T k>`, `<Section titleKey>`, and
 * `labelKey` entries inside link-list item literals.
 */
export function extractReferencedMessageKeys(mdx: string): string[] {
  const keys = new Set<string>();
  for (const match of mdx.matchAll(/<T\s+k="([^"]+)"/g)) {
    keys.add(match[1] as string);
  }
  for (const match of mdx.matchAll(/titleKey="([^"]+)"/g)) {
    keys.add(match[1] as string);
  }
  for (const match of mdx.matchAll(/labelKey:\s*"([^"]+)"/g)) {
    keys.add(match[1] as string);
  }
  return [...keys];
}

describe("docs page message key coverage", () => {
  test("every referenced key resolves through the page-messages schema", () => {
    const unresolved: string[] = [];

    for (const pagePath of findDocsPageFiles(DOCS_ROOT)) {
      const mdx = readFileSync(pagePath, "utf8");
      // Pages on a shared namespace resolve against a different message file.
      if (!/messageNamespace:\s*"local"/.test(mdx)) {
        continue;
      }
      const referencedKeys = extractReferencedMessageKeys(mdx);
      if (referencedKeys.length === 0) {
        continue;
      }

      const messagesDirectory = join(
        pagePath.replace(/\/page\.mdx$/, ""),
        "messages",
      );
      for (const locale of supportedLocales) {
        const messagesPath = join(messagesDirectory, `${locale}.json`);
        // Only high-traffic pages ship every locale; absent files are not drift.
        if (!existsSync(messagesPath)) {
          continue;
        }
        const parsed = pageMessagesSchema.safeParse(
          JSON.parse(readFileSync(messagesPath, "utf8")),
        );
        if (!parsed.success) {
          unresolved.push(`${messagesPath}: does not parse as page messages`);
          continue;
        }
        for (const key of referencedKeys) {
          if (!lookupMessage(parsed.data, key).ok) {
            unresolved.push(`${messagesPath}: ${key}`);
          }
        }
      }
    }

    expect(unresolved).toEqual([]);
  });
});
