/**
 * Static-export success proofs for the three W11 published reference routes.
 *
 * Bun-side page tests can pass while webpack stubs `createRequire` and the
 * shipped `out/` HTML still renders error inventories. This suite reads the
 * exported HTML after `make build` (opt-in via VERIFY_PRODUCTION_INTEGRATION_TESTS=1).
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { shouldRunVerifyProductionIntegrationTests } from "@/lib/verify/server-lifecycle";

const repoRoot = join(import.meta.dir, "../../../..");

const PUBLISHED_ROUTES = [
  {
    slug: "cli",
    htmlRelativePath: "out/docs/references/cli.html",
    inventoryAttr: "data-cli-command-inventory",
    countAttr: "data-cli-command-count",
  },
  {
    slug: "mcp-reference",
    htmlRelativePath: "out/docs/references/mcp-reference.html",
    inventoryAttr: "data-mcp-tool-inventory",
    countAttr: "data-mcp-tool-count",
  },
  {
    slug: "javascript-runtime",
    htmlRelativePath: "out/docs/references/javascript-runtime.html",
    inventoryAttr: "data-javascript-runtime-inventory",
    countAttr: "data-javascript-symbol-count",
  },
] as const;

function readCountAttribute(html: string, attr: string): number {
  const match = html.match(new RegExp(`${attr}="(\\d+)"`));
  expect(match).not.toBeNull();
  return Number(match?.[1]);
}

describe("W11 CLI/MCP/JS static-export inventory success", () => {
  test("exported HTML shows data-inventory-state=success with non-zero counts", () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    for (const route of PUBLISHED_ROUTES) {
      const absolutePath = join(repoRoot, route.htmlRelativePath);
      expect(existsSync(absolutePath)).toBe(true);

      const html = readFileSync(absolutePath, "utf8");
      expect(html).toContain(`${route.inventoryAttr}`);
      expect(html).toContain('data-inventory-state="success"');
      expect(html).not.toContain('data-inventory-state="error"');

      const count = readCountAttribute(html, route.countAttr);
      expect(count).toBeGreaterThan(0);
    }
  });
});
