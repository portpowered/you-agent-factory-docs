import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  LANDING_VALUE_STATEMENT,
} from "../../src/lib/shell";
import { withBasePath } from "../../src/lib/site";

const projectRoot = join(import.meta.dir, "../..");

describe("homepage shell configuration", () => {
  test("exposes shared CTA labels and external links", () => {
    expect(DOCS_CTA_LABEL.length).toBeGreaterThan(0);
    expect(GITHUB_CTA_LABEL.length).toBeGreaterThan(0);
    expect(GITHUB_REPO_URL.startsWith("https://github.com/")).toBe(true);
    expect(LANDING_VALUE_STATEMENT.length).toBeGreaterThan(0);
  });
});

describe("homepage shell export output", () => {
  test("renders accessible landing shell CTAs in the static homepage", () => {
    const build = spawnSync("bun", ["run", "build"], {
      cwd: projectRoot,
      encoding: "utf8",
      env: process.env,
    });

    expect(build.status).toBe(0);

    const homepageHtml = readFileSync(
      join(projectRoot, "out/index.html"),
      "utf8",
    );

    expect(homepageHtml).toContain(
      `<h1 id="landing-hero-title">${PROJECT_NAME}</h1>`,
    );
    expect(homepageHtml).toContain(LANDING_VALUE_STATEMENT);
    expect(homepageHtml).toContain(`aria-label="Primary"`);
    expect(homepageHtml).toContain(DOCS_CTA_LABEL);
    expect(homepageHtml).toContain(GITHUB_CTA_LABEL);
    expect(homepageHtml).toContain(withBasePath(DOCS_ENTRY_ROUTE));
    expect(homepageHtml).toContain(GITHUB_REPO_URL);
    expect(homepageHtml).toContain('rel="noopener noreferrer"');
  }, 120_000);
});
