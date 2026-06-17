import { afterEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { SITE_BASE_PATH } from "../../src/lib/site";
import { STATIC_EXPORT_SKIP_BUILD_ENV } from "../../src/lib/validation/static-export";
import {
  buildStaticExport,
  findAvailableLocalPort,
  shouldSkipStaticExportBuild,
  startStaticExportServer,
} from "../helpers/static-export-server";

const projectRoot = join(import.meta.dir, "../..");
const exportDir = join(projectRoot, "out");

describe("static export server helpers", () => {
  const originalSkipBuild = process.env[STATIC_EXPORT_SKIP_BUILD_ENV];

  afterEach(() => {
    if (originalSkipBuild === undefined) {
      delete process.env[STATIC_EXPORT_SKIP_BUILD_ENV];
    } else {
      process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = originalSkipBuild;
    }
  });

  test("shouldSkipStaticExportBuild reads STATIC_EXPORT_SKIP_BUILD", () => {
    process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = "1";
    expect(shouldSkipStaticExportBuild()).toBe(true);

    delete process.env[STATIC_EXPORT_SKIP_BUILD_ENV];
    expect(shouldSkipStaticExportBuild()).toBe(false);
  });

  test("buildStaticExport skips rebuild when STATIC_EXPORT_SKIP_BUILD is set and out/ exists", () => {
    if (!existsSync(exportDir)) {
      buildStaticExport();
    }

    process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = "1";

    expect(() => buildStaticExport()).not.toThrow();
  });

  test("buildStaticExport fails fast when skip is set but out/ is missing", () => {
    const backupDir = join(projectRoot, "out.skip-build-test-backup");
    let movedExport = false;

    if (existsSync(exportDir)) {
      rmSync(backupDir, { recursive: true, force: true });
      renameSync(exportDir, backupDir);
      movedExport = true;
    }

    process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = "1";

    expect(() => buildStaticExport()).toThrow(/missing at out\//);

    if (movedExport) {
      renameSync(backupDir, exportDir);
    }
  });

  test("findAvailableLocalPort returns a positive localhost port", async () => {
    expect(await findAvailableLocalPort()).toBeGreaterThan(0);
  });

  test("startStaticExportServer returns a base-path server handle", async () => {
    const homepageHtmlPath = join(exportDir, "index.html");
    const fallbackHomepageHtml =
      "<!doctype html><html><head><title>Snapshot fallback</title></head><body><main>Snapshot fallback body</main></body></html>";
    let createdFallbackExport = false;

    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
      writeFileSync(homepageHtmlPath, fallbackHomepageHtml, "utf8");
      createdFallbackExport = true;
    }

    const port = await findAvailableLocalPort();
    const server = startStaticExportServer(port);

    try {
      expect(server.baseUrl).toBe(`http://127.0.0.1:${port}${SITE_BASE_PATH}/`);
      expect(typeof server.stop).toBe("function");
    } finally {
      server.stop();

      if (createdFallbackExport) {
        rmSync(exportDir, { recursive: true, force: true });
      }
    }
  });
});
