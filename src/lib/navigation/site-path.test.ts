import { describe, expect, test } from "bun:test";
import {
  normalizeAppPathTrailingSlash,
  stripBasePathFromHref,
  withBasePath,
} from "./site-path";

const PROJECT_SITE_BASE_PATH = "/you-agent-factory-docs";

describe("normalizeAppPathTrailingSlash", () => {
  test("keeps root and strips trailing slashes from non-root paths", () => {
    expect(normalizeAppPathTrailingSlash("/")).toBe("/");
    expect(normalizeAppPathTrailingSlash("")).toBe("/");
    expect(normalizeAppPathTrailingSlash("/docs/factories")).toBe(
      "/docs/factories",
    );
    expect(normalizeAppPathTrailingSlash("/docs/factories/")).toBe(
      "/docs/factories",
    );
    expect(normalizeAppPathTrailingSlash("/docs/workers/")).toBe(
      "/docs/workers",
    );
  });
});

describe("withBasePath", () => {
  test("returns href unchanged when base path is empty", () => {
    expect(withBasePath("/docs/glossary", "")).toBe("/docs/glossary");
  });

  test("prefixes internal absolute paths with the live project-site base path", () => {
    expect(withBasePath("/docs/glossary", PROJECT_SITE_BASE_PATH)).toBe(
      "/you-agent-factory-docs/docs/glossary",
    );
  });

  test("leaves external and hash links unchanged", () => {
    expect(
      withBasePath("https://example.com/docs", PROJECT_SITE_BASE_PATH),
    ).toBe("https://example.com/docs");
    expect(withBasePath("#section", PROJECT_SITE_BASE_PATH)).toBe("#section");
  });

  test("does not double-prefix already-prefixed hrefs", () => {
    expect(
      withBasePath(
        "/you-agent-factory-docs/docs/glossary",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/you-agent-factory-docs/docs/glossary");
  });
});

describe("stripBasePathFromHref", () => {
  test("strips the live project-site prefix from absolute hrefs", () => {
    expect(
      stripBasePathFromHref(
        "/you-agent-factory-docs/docs/glossary",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe("/docs/glossary");
    expect(
      stripBasePathFromHref("/you-agent-factory-docs/", PROJECT_SITE_BASE_PATH),
    ).toBe("/");
  });

  test("leaves hrefs unchanged when base path is empty or absent", () => {
    expect(stripBasePathFromHref("/docs/glossary", "")).toBe("/docs/glossary");
    expect(
      stripBasePathFromHref("/docs/glossary", PROJECT_SITE_BASE_PATH),
    ).toBe("/docs/glossary");
  });
});
