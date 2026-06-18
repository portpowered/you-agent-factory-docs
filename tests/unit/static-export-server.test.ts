import { afterEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { SITE_BASE_PATH } from "../../src/lib/site";
import { STATIC_EXPORT_SKIP_BUILD_ENV } from "../../src/lib/validation/static-export";
import { withStaticExportBuildLock } from "../../src/lib/validation/static-export-build-lock";
import { fetchHttp } from "../helpers/http";
import {
  buildStaticExport,
  ensureStaticExportBuilt,
  shouldSkipStaticExportBuild,
  startStaticExportServer,
  waitForStaticExportServer,
} from "../helpers/static-export-server";
import { getTestPort } from "../helpers/test-port";

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

    withStaticExportBuildLock(projectRoot, () => {
      process.env[STATIC_EXPORT_SKIP_BUILD_ENV] = "1";

      expect(() => buildStaticExport()).not.toThrow();
    });
  }, 120_000);

  test("buildStaticExport fails fast when skip is set but out/ is missing", () => {
    withStaticExportBuildLock(projectRoot, () => {
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
  });

  test("startStaticExportServer serves an isolated snapshot of out/", async () => {
    await ensureStaticExportBuilt();

    const homepageHtmlPath = join(exportDir, "index.html");
    const originalHomepageHtml = readFileSync(homepageHtmlPath, "utf8");
    const stableOriginalTitle = "<title>You Agent Factory</title>";
    const stableOriginalHeading =
      "An open-source, engineering-native platform for turning recurring development work into reusable, inspectable AI agent workflows.";
    const port = getTestPort(3791, "STATIC_EXPORT_SERVER_SNAPSHOT_TEST_PORT");
    const server = startStaticExportServer(port);

    await waitForStaticExportServer(server.baseUrl);

    try {
      writeFileSync(
        homepageHtmlPath,
        "<!doctype html><title>mutated</title>",
        "utf8",
      );

      const response = await fetchHttp(
        `http://127.0.0.1:${port}${SITE_BASE_PATH}/`,
        {
          signal: AbortSignal.timeout(10_000),
        },
      );
      const servedHtml = await response.text();

      expect(response.status).toBe(200);
      expect(originalHomepageHtml).toContain(stableOriginalTitle);
      expect(originalHomepageHtml).toContain(stableOriginalHeading);
      expect(servedHtml).toContain(stableOriginalTitle);
      expect(servedHtml).toContain(stableOriginalHeading);
      expect(servedHtml).not.toContain("<title>mutated</title>");
    } finally {
      writeFileSync(homepageHtmlPath, originalHomepageHtml, "utf8");
      server.stop();
    }
  }, 180_000);
});
