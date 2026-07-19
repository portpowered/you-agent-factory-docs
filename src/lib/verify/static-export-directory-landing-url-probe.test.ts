import { describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
  STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES,
  verifyExportDirectoryLandings,
} from "@/lib/build/export-out-directory";
import { httpGetText } from "./http-harness";
import {
  directoryLandingUrlFormProbes,
  directoryLandingUrlFormsSucceeded,
} from "./static-export-directory-landing-url-probe";
import { createStaticExportHttpServer } from "./static-export-http-server";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const FAMILY_INDEX_ROUTES = [
  "/docs/factories",
  "/docs/workers",
  "/docs/workstations",
] as const;
const repoRoot = join(import.meta.dir, "../../..");

function writeDirectoryLandingFixture(
  root: string,
  routes: readonly string[],
): void {
  writeFileSync(join(root, "index.html"), "<html>home</html>");
  for (const route of routes) {
    const relative = exportHtmlRelativePath(route);
    const absolute = join(root, relative);
    mkdirSync(join(absolute, ".."), { recursive: true });
    writeFileSync(absolute, `<html>${route}</html>`);
  }
}

describe("directoryLandingUrlFormProbes", () => {
  test("builds non-slash and trailing-slash URLs under a project-site base", () => {
    const probes = directoryLandingUrlFormProbes(
      `http://127.0.0.1:3456${PROJECT_SITE_BASE_PATH}`,
      FAMILY_INDEX_ROUTES,
    );

    expect(probes).toEqual([
      {
        route: "/docs/factories",
        nonSlashUrl: `http://127.0.0.1:3456${PROJECT_SITE_BASE_PATH}/docs/factories`,
        trailingSlashUrl: `http://127.0.0.1:3456${PROJECT_SITE_BASE_PATH}/docs/factories/`,
      },
      {
        route: "/docs/workers",
        nonSlashUrl: `http://127.0.0.1:3456${PROJECT_SITE_BASE_PATH}/docs/workers`,
        trailingSlashUrl: `http://127.0.0.1:3456${PROJECT_SITE_BASE_PATH}/docs/workers/`,
      },
      {
        route: "/docs/workstations",
        nonSlashUrl: `http://127.0.0.1:3456${PROJECT_SITE_BASE_PATH}/docs/workstations`,
        trailingSlashUrl: `http://127.0.0.1:3456${PROJECT_SITE_BASE_PATH}/docs/workstations/`,
      },
    ]);
  });

  test("directoryLandingUrlFormsSucceeded requires 200 for both forms", () => {
    expect(
      directoryLandingUrlFormsSucceeded([
        {
          route: "/docs/factories",
          nonSlashStatus: 200,
          trailingSlashStatus: 200,
        },
      ]),
    ).toBe(true);
    expect(
      directoryLandingUrlFormsSucceeded([
        {
          route: "/docs/factories",
          nonSlashStatus: 200,
          trailingSlashStatus: 404,
        },
      ]),
    ).toBe(false);
  });
});

describe("static-export directory landing dual-URL probe", () => {
  test("project-site fixture resolves both URL forms for required collection indexes", async () => {
    const root = mkdtempSync(join(tmpdir(), "directory-landing-dual-url-"));
    writeDirectoryLandingFixture(
      root,
      STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES,
    );

    const session = await createStaticExportHttpServer({
      outDir: root,
      basePath: PROJECT_SITE_BASE_PATH,
      port: 3456,
    });

    try {
      const probes = directoryLandingUrlFormProbes(
        session.baseUrl,
        STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES,
      );
      const results = [];

      for (const probe of probes) {
        const nonSlash = await httpGetText(probe.nonSlashUrl);
        const trailingSlash = await httpGetText(probe.trailingSlashUrl);
        expect(nonSlash.status).toBe(200);
        expect(trailingSlash.status).toBe(200);
        expect(nonSlash.body).toContain(probe.route);
        expect(trailingSlash.body).toContain(probe.route);
        results.push({
          route: probe.route,
          nonSlashStatus: nonSlash.status,
          trailingSlashStatus: trailingSlash.status,
        });
      }

      expect(directoryLandingUrlFormsSucceeded(results)).toBe(true);
      expect(probes.some((probe) => probe.route === "/docs/factories")).toBe(
        true,
      );
      expect(probes.some((probe) => probe.route === "/docs/workers")).toBe(
        true,
      );
      expect(probes.some((probe) => probe.route === "/docs/workstations")).toBe(
        true,
      );
    } finally {
      await session.cleanup();
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("flat-only HTML returns 404 for trailing-slash family URLs", async () => {
    const root = mkdtempSync(join(tmpdir(), "directory-landing-flat-only-"));
    writeFileSync(join(root, "index.html"), "<html>home</html>");
    for (const route of FAMILY_INDEX_ROUTES) {
      const flat = `${route.slice(1)}.html`;
      mkdirSync(join(root, flat, ".."), { recursive: true });
      writeFileSync(join(root, flat), `<html>${route}</html>`);
    }

    const session = await createStaticExportHttpServer({
      outDir: root,
      basePath: PROJECT_SITE_BASE_PATH,
      port: 3457,
    });

    try {
      for (const route of FAMILY_INDEX_ROUTES) {
        const trailingSlash = await httpGetText(`${session.baseUrl}${route}/`);
        // Without …/index.html landings, trailing-slash URLs 404 the same way
        // GitHub Pages does for flat-only export HTML.
        expect(trailingSlash.status).toBe(404);
      }
    } finally {
      await session.cleanup();
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("trusted project-site out/ serves both URL forms for family landings", async () => {
    // Runs whenever a trusted local `out/` exists (after `make build`).
    const outDir = join(repoRoot, DEFAULT_EXPORT_OUT_DIR);
    if (!existsSync(outDir)) {
      return;
    }

    const landings = verifyExportDirectoryLandings(
      DEFAULT_EXPORT_OUT_DIR,
      repoRoot,
    );
    expect(landings).toEqual({ ok: true });

    const session = await createStaticExportHttpServer({
      outDir: DEFAULT_EXPORT_OUT_DIR,
      cwd: repoRoot,
      basePath: PROJECT_SITE_BASE_PATH,
      port: 3458,
    });

    try {
      const probes = directoryLandingUrlFormProbes(
        session.baseUrl,
        STATIC_EXPORT_REQUIRED_DIRECTORY_LANDING_ROUTES,
      );
      const results = [];

      for (const probe of probes) {
        const nonSlash = await httpGetText(probe.nonSlashUrl);
        const trailingSlash = await httpGetText(probe.trailingSlashUrl);
        expect(nonSlash.status, `${probe.nonSlashUrl} expected 200`).toBe(200);
        expect(
          trailingSlash.status,
          `${probe.trailingSlashUrl} expected 200`,
        ).toBe(200);
        results.push({
          route: probe.route,
          nonSlashStatus: nonSlash.status,
          trailingSlashStatus: trailingSlash.status,
        });
      }

      expect(directoryLandingUrlFormsSucceeded(results)).toBe(true);
    } finally {
      await session.cleanup();
    }
  });
});
