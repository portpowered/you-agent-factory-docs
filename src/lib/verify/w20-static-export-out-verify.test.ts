/**
 * W20 story 006: prove a trusted `out/` embeds FR-33 reference corpus and
 * FR-34 no-live-host / no-playground / no-proxy markers after `make build`.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateStaticExportConvergence,
  W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES,
  W20_STATIC_EXPORT_SUITE_COMMAND,
} from "./w20-static-export-convergence";

const repoRoot = join(import.meta.dir, "../../..");
const outDir = join(repoRoot, "out");

describe("W20 static-export out/ FR-33 + FR-34 verify", () => {
  test("trusted out/ embeds reference corpus without a live Factory host", () => {
    expect(existsSync(outDir)).toBe(true);

    const result = evaluateStaticExportConvergence("out", repoRoot);
    if (!result.ok) {
      console.error(
        [
          "W20 static-export out/ verify failed:",
          ...result.reasons.map((reason) => `  - ${reason}`),
          `Reproduce with: ${W20_STATIC_EXPORT_SUITE_COMMAND}`,
        ].join("\n"),
      );
    }

    expect(result.ok).toBe(true);
    expect(result.routeChecks.length).toBe(
      W20_STATIC_EXPORT_REQUIRED_ROUTE_PROBES.length,
    );
    expect(result.routeChecks.every((check) => check.ok)).toBe(true);
    expect(result.forbiddenProxyHits).toEqual([]);
  });
});
