import { describe, expect, test } from "bun:test";
import {
  DOCS_ENTRY_ROUTE,
  SITE_BASE_PATH,
  withBasePath,
} from "../../src/lib/site";

describe("site configuration", () => {
  test("uses a GitHub Pages project-site base path", () => {
    expect(SITE_BASE_PATH).toBe("/you-agent-factory-docs");
  });

  test("keeps /docs as the canonical docs entry route", () => {
    expect(DOCS_ENTRY_ROUTE).toBe("/docs");
    expect(DOCS_ENTRY_ROUTE).not.toMatch(/^\/[a-z]{2}\//);
  });

  test("prefixes internal paths with the configured base path", () => {
    expect(withBasePath("/docs")).toBe("/you-agent-factory-docs/docs");
    expect(withBasePath("docs")).toBe("/you-agent-factory-docs/docs");
  });
});
