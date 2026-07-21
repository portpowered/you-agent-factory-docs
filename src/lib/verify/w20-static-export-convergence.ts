/**
 * W20 story 006: full static export without a live Factory host.
 *
 * Owns the reviewer-followable inventory of `make build` / `build:export`
 * plus FR-33 (exported reference corpus present) and FR-34 (no live host /
 * playground / proxy) proofs on the post-W19 tip. Does not redesign nav,
 * search, locale, migration, or renderer ownership.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { API_PROXY_POLICY } from "@/components/references/api/playground-suppression";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
  verifyExportOutDirectory,
} from "@/lib/build/export-out-directory";

export type W20StaticExportGateFamily =
  | "full-static-export"
  | "exported-reference-corpus"
  | "no-live-factory-host"
  | "playground-suppression"
  | "proxy-route-absence";

export type W20StaticExportCommandGate = {
  /** Shared Makefile target maintainers reproduce with. */
  makeTarget: string;
  /** package.json script invoked by the Makefile target. */
  packageScript: string;
  families: readonly W20StaticExportGateFamily[];
};

export type W20StaticExportSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / FR convergence. */
  families: readonly W20StaticExportGateFamily[];
};

export type W20ExportedRouteProbe = {
  /** Site-relative path (no project basePath prefix). */
  path: string;
  /** Family label for FR-33 evidence. */
  family:
    | "api"
    | "events"
    | "schema"
    | "cli"
    | "mcp"
    | "javascript"
    | "factory"
    | "worker"
    | "workstation";
  /** Substrings that must appear in exported HTML (reference corpus). */
  corpusMarkers: readonly string[];
  /** Substrings that prove static-only / no-host chrome (empty when N/A). */
  noHostMarkers: readonly string[];
};

/**
 * Maintainer command gate: full static export that emits trusted `out/`.
 */
export const W20_STATIC_EXPORT_COMMAND_GATES = [
  {
    makeTarget: "build",
    packageScript: "build:export",
    families: ["full-static-export"],
  },
] as const satisfies readonly W20StaticExportCommandGate[];

/**
 * Focused suites catalogued for reviewer evidence. `make build` produces
 * `out/`; the W20 binder re-runs contract suites + the out/ verify suite after
 * the export so convergence does not invent a second export pipeline.
 */
export const W20_STATIC_EXPORT_SUITE_ENTRIES = [
  {
    path: "src/components/references/api/playground-suppression.test.ts",
    families: [
      "playground-suppression",
      "no-live-factory-host",
      "proxy-route-absence",
    ],
  },
  {
    path: "src/lib/references/events/events-lib.test.ts",
    families: ["no-live-factory-host", "proxy-route-absence"],
  },
  {
    path: "src/content/docs/references/published-route-states.test.tsx",
    families: ["no-live-factory-host", "exported-reference-corpus"],
  },
  {
    path: "src/lib/verify/w20-static-export-out-verify.test.ts",
    families: [
      "full-static-export",
      "exported-reference-corpus",
      "no-live-factory-host",
      "playground-suppression",
      "proxy-route-absence",
    ],
  },
] as const satisfies readonly W20StaticExportSuiteEntry[];

/**
 * Suites the W20 runner executes after `make build`.
 */
export const W20_STATIC_EXPORT_POST_COMMAND_SUITE_PATHS = [
  "src/components/references/api/playground-suppression.test.ts",
  "src/lib/references/events/events-lib.test.ts",
  "src/content/docs/references/published-route-states.test.tsx",
  "src/lib/verify/w20-static-export-out-verify.test.ts",
] as const;

/**
 * Representative exported routes that must embed runtime-readable reference
 * data after static export (FR-33). Covers API, events, schemas, CLI, MCP,
 * JavaScript, and authored factory/worker/workstation surfaces.
 */
export const W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES = [
  {
    path: "/docs/references/api",
    family: "api",
    corpusMarkers: [
      "data-api-operation-section",
      "data-api-playground-suppressed",
    ],
    noHostMarkers: ['data-api-playground-suppressed="true"'],
  },
  {
    path: "/docs/references/events",
    family: "events",
    corpusMarkers: ["data-event-type", "data-sse-proxy"],
    noHostMarkers: [
      'data-sse-proxy="false"',
      'data-sse-live-connection="false"',
    ],
  },
  {
    path: "/docs/references/factory-schema",
    family: "schema",
    corpusMarkers: ["data-schema-field-name"],
    noHostMarkers: [],
  },
  {
    path: "/docs/references/cli",
    family: "cli",
    corpusMarkers: ["data-cli-command-inventory"],
    noHostMarkers: [],
  },
  {
    path: "/docs/references/mcp-reference",
    family: "mcp",
    corpusMarkers: ["data-mcp-tool-inventory"],
    noHostMarkers: [],
  },
  {
    path: "/docs/references/javascript-runtime",
    family: "javascript",
    corpusMarkers: ["data-javascript-runtime-inventory"],
    noHostMarkers: [],
  },
  {
    path: "/docs/factories/packaged",
    family: "factory",
    corpusMarkers: ["data-schema-field-name"],
    noHostMarkers: [],
  },
  {
    path: "/docs/workers/hosted",
    family: "worker",
    corpusMarkers: ["data-schema-field-name"],
    noHostMarkers: [],
  },
  {
    path: "/docs/workstations/standard",
    family: "workstation",
    corpusMarkers: ["data-schema-field-name"],
    noHostMarkers: [],
  },
] as const satisfies readonly W20ExportedRouteProbe[];

/** Forbidden docs-side proxy route segments under `out/` (FR-34). */
export const W20_STATIC_EXPORT_FORBIDDEN_PROXY_SEGMENTS =
  API_PROXY_POLICY.forbiddenProxyRouteSegments;

export const W20_STATIC_EXPORT_REQUIRED_TEST_PATHS =
  W20_STATIC_EXPORT_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_STATIC_EXPORT_REQUIRED_FAMILIES = [
  "full-static-export",
  "exported-reference-corpus",
  "no-live-factory-host",
  "playground-suppression",
  "proxy-route-absence",
] as const satisfies readonly W20StaticExportGateFamily[];

export const W20_STATIC_EXPORT_SUITE_COMMAND = "make test-w20-static-export";

/** Minimum non-empty HTML size so stub/placeholder pages fail closed. */
export const W20_STATIC_EXPORT_MIN_HTML_BYTES = 512;

export type W20StaticExportRouteCheck = {
  path: string;
  htmlRelativePath: string;
  ok: boolean;
  reasons: string[];
};

export type W20StaticExportEvaluation = {
  ok: boolean;
  outDir: string;
  routeChecks: W20StaticExportRouteCheck[];
  forbiddenProxyHits: string[];
  reasons: string[];
};

function resolveAbsoluteOutDir(
  outDir: string = DEFAULT_EXPORT_OUT_DIR,
  cwd: string = process.cwd(),
): string {
  return isAbsolute(outDir) ? outDir : join(cwd, outDir);
}

/**
 * Evaluates a trusted `out/` for FR-33 (reference corpus present) and FR-34
 * (no live-host / playground / proxy markers or forbidden proxy routes).
 */
export function evaluateStaticExportConvergence(
  outDir: string = DEFAULT_EXPORT_OUT_DIR,
  cwd: string = process.cwd(),
): W20StaticExportEvaluation {
  const absoluteOutDir = resolveAbsoluteOutDir(outDir, cwd);
  const reasons: string[] = [];
  const directory = verifyExportOutDirectory(outDir, cwd);
  if (!directory.ok) {
    return {
      ok: false,
      outDir: absoluteOutDir,
      routeChecks: [],
      forbiddenProxyHits: [],
      reasons: [directory.reason],
    };
  }

  const routeChecks: W20StaticExportRouteCheck[] = [];
  for (const probe of W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES) {
    const htmlRelativePath = exportHtmlRelativePath(probe.path);
    const absoluteHtmlPath = join(absoluteOutDir, htmlRelativePath);
    const checkReasons: string[] = [];

    if (!existsSync(absoluteHtmlPath)) {
      checkReasons.push(`missing exported HTML at ${htmlRelativePath}`);
    } else {
      const size = statSync(absoluteHtmlPath).size;
      if (size < W20_STATIC_EXPORT_MIN_HTML_BYTES) {
        checkReasons.push(
          `${htmlRelativePath} is too small (${size} bytes; min ${W20_STATIC_EXPORT_MIN_HTML_BYTES})`,
        );
      }

      const html = readFileSync(absoluteHtmlPath, "utf8");
      for (const marker of probe.corpusMarkers) {
        if (!html.includes(marker)) {
          checkReasons.push(
            `${htmlRelativePath} missing corpus marker "${marker}"`,
          );
        }
      }

      for (const marker of probe.noHostMarkers) {
        if (!html.includes(marker)) {
          checkReasons.push(
            `${htmlRelativePath} missing no-host marker "${marker}"`,
          );
        }
      }

      // Interactive playground Send controls must not appear in static export.
      if (
        probe.family === "api" &&
        /type="submit"[^>]*>\s*Send\s*</.test(html)
      ) {
        checkReasons.push(
          `${htmlRelativePath} still exposes a playground Send control`,
        );
      }
    }

    const ok = checkReasons.length === 0;
    routeChecks.push({
      path: probe.path,
      htmlRelativePath,
      ok,
      reasons: checkReasons,
    });
    if (!ok) {
      reasons.push(...checkReasons);
    }
  }

  const forbiddenProxyHits: string[] = [];
  for (const segment of W20_STATIC_EXPORT_FORBIDDEN_PROXY_SEGMENTS) {
    const candidates = [
      join(absoluteOutDir, `${segment}.html`),
      join(absoluteOutDir, segment, "index.html"),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        forbiddenProxyHits.push(candidate);
        reasons.push(`forbidden proxy route exported at ${candidate}`);
      }
    }
  }

  return {
    ok: reasons.length === 0,
    outDir: absoluteOutDir,
    routeChecks,
    forbiddenProxyHits,
    reasons,
  };
}

export function listW20StaticExportCoveredFamilies(): W20StaticExportGateFamily[] {
  const covered = new Set<W20StaticExportGateFamily>();
  for (const gate of W20_STATIC_EXPORT_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  for (const entry of W20_STATIC_EXPORT_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}
