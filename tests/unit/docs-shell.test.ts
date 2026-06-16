import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import {
  DOCS_NAV_HEADING,
  DOCS_NAV_OVERVIEW_LABEL,
  DOCS_SHELL_FRAMING_TEXT,
  DOCS_SHELL_TITLE,
  GITHUB_CTA_LABEL,
  HOME_CTA_LABEL,
} from "../../src/lib/shell";
import { withBasePath } from "../../src/lib/site";

const projectRoot = join(import.meta.dir, "../..");

describe("docs shell configuration", () => {
  test("exposes shared docs shell labels and framing copy", () => {
    expect(DOCS_SHELL_TITLE.length).toBeGreaterThan(0);
    expect(DOCS_NAV_HEADING.length).toBeGreaterThan(0);
    expect(DOCS_NAV_OVERVIEW_LABEL.length).toBeGreaterThan(0);
    expect(DOCS_SHELL_FRAMING_TEXT.length).toBeGreaterThan(0);
    expect(HOME_CTA_LABEL.length).toBeGreaterThan(0);
  });
});

describe("docs shell export output", () => {
  test("renders accessible docs shell landmarks in the static export", () => {
    const build = spawnSync("bun", ["run", "build"], {
      cwd: projectRoot,
      encoding: "utf8",
      env: process.env,
    });

    expect(build.status).toBe(0);

    const docsHtml = readFileSync(
      join(projectRoot, "out/docs/index.html"),
      "utf8",
    );

    expect(docsHtml).toContain(`<header class="docs-shell__header">`);
    expect(docsHtml).toContain(`aria-label="${DOCS_NAV_HEADING}"`);
    expect(docsHtml).toContain(`<main class="docs-shell__main">`);
    expect(docsHtml).toContain(
      `<h1 id="docs-shell-title">${DOCS_SHELL_TITLE}</h1>`,
    );
    expect(docsHtml).toContain(DOCS_SHELL_FRAMING_TEXT);
    expect(docsHtml).toContain(PROJECT_NAME);
    expect(docsHtml).toContain(HOME_CTA_LABEL);
    expect(docsHtml).toContain(GITHUB_CTA_LABEL);
    expect(docsHtml).toContain(withBasePath("/"));
    expect(docsHtml).toContain('aria-current="page"');
    expect(docsHtml).toContain(DOCS_NAV_OVERVIEW_LABEL);
    expect(docsHtml).toContain(withBasePath(DOCS_ENTRY_ROUTE));
  }, 120_000);
});
