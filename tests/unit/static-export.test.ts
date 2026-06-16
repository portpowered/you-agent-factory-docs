import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import nextConfig from "../../next.config";
import {
  DOCS_ENTRY_ROUTE,
  SITE_BASE_PATH,
  withBasePath,
} from "../../src/lib/site";
import { DOCS_SHELL_TITLE } from "../../src/lib/shell";

const projectRoot = join(import.meta.dir, "../..");

describe("static export configuration", () => {
  test("configures Next.js for fully static GitHub Pages export", () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.basePath).toBe(SITE_BASE_PATH);
    expect(nextConfig.assetPrefix).toBe(`${SITE_BASE_PATH}/`);
    expect(nextConfig.trailingSlash).toBe(true);
    expect(nextConfig.images?.unoptimized).toBe(true);
  });

  test("production build emits homepage and docs-shell routes in static export output", () => {
    const build = spawnSync("bun", ["run", "build"], {
      cwd: projectRoot,
      encoding: "utf8",
      env: process.env,
    });

    expect(build.status).toBe(0);

    const homepagePath = join(projectRoot, "out/index.html");
    const docsPath = join(projectRoot, "out/docs/index.html");

    expect(existsSync(homepagePath)).toBe(true);
    expect(existsSync(docsPath)).toBe(true);

    const homepageHtml = readFileSync(homepagePath, "utf8");
    const docsHtml = readFileSync(docsPath, "utf8");

    expect(homepageHtml).toContain("You Agent Factory");
    expect(homepageHtml).toContain(withBasePath(DOCS_ENTRY_ROUTE));
    expect(docsHtml).toContain(DOCS_SHELL_TITLE);
    expect(docsHtml).toContain(withBasePath("/"));
  }, 120_000);
});
