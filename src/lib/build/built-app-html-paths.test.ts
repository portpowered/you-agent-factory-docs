import { describe, expect, test } from "bun:test";
import {
  BUILT_APP_GITHUB_PAGES_BASE_PATH,
  normalizeBuiltAppHtmlInternalPaths,
} from "./built-app-html-paths";

describe("built-app-html-paths", () => {
  test("live project-site default is /you-agent-factory-docs", () => {
    expect(BUILT_APP_GITHUB_PAGES_BASE_PATH).toBe("/you-agent-factory-docs");
  });

  test("normalizeBuiltAppHtmlInternalPaths strips the live project-site prefix", () => {
    const html =
      '<a href="/you-agent-factory-docs/docs/glossary">Glossary</a><a href="/docs/other">Other</a>';
    expect(normalizeBuiltAppHtmlInternalPaths(html)).toContain(
      'href="/docs/glossary"',
    );
    expect(normalizeBuiltAppHtmlInternalPaths(html)).toContain(
      'href="/docs/other"',
    );
  });

  test("normalizeBuiltAppHtmlInternalPaths leaves root HTML unchanged", () => {
    const html = '<a href="/docs/glossary">Glossary</a>';
    expect(normalizeBuiltAppHtmlInternalPaths(html)).toBe(html);
  });
});
