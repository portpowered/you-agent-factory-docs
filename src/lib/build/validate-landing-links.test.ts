import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  extractLandingLinkReferences,
  isInternalLandingHref,
  LANDING_LINK_SOURCE_FILES,
  listLandingLinkTargets,
  normalizeLandingHref,
  validateLandingLinks,
} from "./validate-landing-links";

function writeSource(content: string): { cwd: string; file: string } {
  const cwd = mkdtempSync(join(tmpdir(), "landing-links-"));
  const file = join("src", "landing.ts");
  mkdirSync(join(cwd, "src"), { recursive: true });
  writeFileSync(join(cwd, file), content, "utf8");
  return { cwd, file };
}

describe("isInternalLandingHref", () => {
  test("keeps root-absolute paths and empty hrefs", () => {
    expect(isInternalLandingHref("/docs/guides")).toBe(true);
    expect(isInternalLandingHref("")).toBe(true);
  });

  test("skips external protocols, mailto, and bare fragments", () => {
    expect(isInternalLandingHref("https://github.com/portpowered")).toBe(false);
    expect(isInternalLandingHref("mailto:dre@youagentfactory.com")).toBe(false);
    expect(isInternalLandingHref("//cdn.example.com/x")).toBe(false);
    expect(isInternalLandingHref("#install")).toBe(false);
  });
});

describe("extractLandingLinkReferences", () => {
  test("finds object, JSX, and braced href literals with line numbers", () => {
    const references = extractLandingLinkReferences(
      "src/landing.ts",
      [
        'const nav = [{ href: "/docs" }];',
        '<a href="/blog">Blog</a>',
        "<A href={'/tags'} />",
        'const external = { href: "https://example.com" };',
      ].join("\n"),
    );

    expect(references).toEqual([
      { file: "src/landing.ts", line: 1, href: "/docs" },
      { file: "src/landing.ts", line: 2, href: "/blog" },
      { file: "src/landing.ts", line: 3, href: "/tags" },
    ]);
  });
});

describe("normalizeLandingHref", () => {
  test("strips hash, query, and trailing slash but preserves root", () => {
    expect(normalizeLandingHref("/docs/guides/")).toBe("/docs/guides");
    expect(normalizeLandingHref("/docs/guides#install")).toBe("/docs/guides");
    expect(normalizeLandingHref("/search?q=loop")).toBe("/search");
    expect(normalizeLandingHref("/")).toBe("/");
  });
});

describe("validateLandingLinks", () => {
  const knownRoutes = ["/", "/docs", "/blog", "/coming-soon/about"];

  test("accepts published routes, coming-soon slugs, and externals", async () => {
    const { cwd, file } = writeSource(
      [
        'a = { href: "/" };',
        'b = { href: "/docs" };',
        'c = { href: "/coming-soon/about" };',
        'd = { href: "https://github.com/portpowered/you-agent-factory" };',
        'e = { href: "mailto:dre@youagentfactory.com" };',
      ].join("\n"),
    );

    try {
      expect(
        await validateLandingLinks({ cwd, files: [file], knownRoutes }),
      ).toEqual([]);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test("reports an empty href", async () => {
    const { cwd, file } = writeSource('a = { href: "" };');

    try {
      const errors = await validateLandingLinks({
        cwd,
        files: [file],
        knownRoutes,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]?.reason).toBe("empty href");
      expect(errors[0]?.line).toBe(1);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test("reports an unknown route", async () => {
    const { cwd, file } = writeSource('a = { href: "/docs/does-not-exist" };');

    try {
      const errors = await validateLandingLinks({
        cwd,
        files: [file],
        knownRoutes,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]?.reason).toContain("no published route");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test("names the replacement for a retired documentation route", async () => {
    const { cwd, file } = writeSource(
      'a = { href: "/docs/documentation/configuration" };',
    );

    try {
      const errors = await validateLandingLinks({
        cwd,
        files: [file],
        knownRoutes,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]?.reason).toContain("retired route superseded by");
      expect(errors[0]?.reason).toContain("/docs/factories/configuration");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test("rejects a relative href on the landing surface", async () => {
    const { cwd, file } = writeSource('a = { href: "docs/guides" };');

    try {
      const errors = await validateLandingLinks({
        cwd,
        files: [file],
        knownRoutes,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]?.reason).toContain("root-absolute path");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

describe("live landing surface", () => {
  test("every shipped landing href resolves to a published route", async () => {
    expect(await validateLandingLinks()).toEqual([]);
  });

  test("covers the landing data, capability strip, and production composer", () => {
    expect(LANDING_LINK_SOURCE_FILES).toContain(
      "src/features/landing-page/landing-page.data.ts",
    );
    expect(LANDING_LINK_SOURCE_FILES).toContain(
      "src/features/landing-page/components/CapabilityStrip.tsx",
    );
    expect(LANDING_LINK_SOURCE_FILES).toContain(
      "src/app/(site)/compose-production-landing-slots.tsx",
    );
  });

  test("target inventory includes coming-soon pages and the docs root", async () => {
    const targets = await listLandingLinkTargets();
    expect(targets).toContain("/coming-soon/about");
    expect(targets).toContain("/coming-soon/harness-support");
    expect(targets).toContain("/docs");
    expect(targets).toContain("/blog");
  });
});
