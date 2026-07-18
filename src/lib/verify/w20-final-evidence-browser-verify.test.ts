/**
 * W20 story 011 browser-path proof: representative exported surfaces load from
 * a trusted `out/` over loopback HTTP without contacting a Factory host.
 *
 * Serves static export via the established `runStaticExportServerLifecycle`
 * harness, fetches API / events / schema / authored factory-worker-workstation
 * pages via Node `httpGetText` (avoids happy-dom CORS), and asserts FR-33
 * corpus + FR-34 no-host markers in the HTML body.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { httpGetText } from "./http-harness";
import { runStaticExportServerLifecycle } from "./static-export-server-lifecycle";
import {
  W20_FINAL_EVIDENCE_BROWSER_PROBES,
  W20_FINAL_EVIDENCE_SUITE_COMMAND,
} from "./w20-final-evidence-convergence";

const repoRoot = join(import.meta.dir, "../../..");
const outDir = join(repoRoot, "out");
const FETCH_TIMEOUT_MS = 8_000;

let cleanup: (() => Promise<void>) | undefined;

afterAll(async () => {
  if (cleanup) {
    await cleanup();
  }
});

describe("W20 final-evidence browser verify (exported surfaces, no Factory host)", () => {
  test("trusted out/ serves representative reference surfaces without a live Factory host", async () => {
    expect(existsSync(outDir)).toBe(true);

    const lifecycle = await runStaticExportServerLifecycle({
      outDir: "out",
      cwd: repoRoot,
      host: "127.0.0.1",
    });

    if (lifecycle.status !== "pass") {
      throw new Error(
        [
          "W20 final-evidence static-export server failed to start:",
          lifecycle.reason,
          `Reproduce with: ${W20_FINAL_EVIDENCE_SUITE_COMMAND}`,
          "Hint: run `make build` first when out/ is missing or stale.",
        ].join("\n"),
      );
    }

    cleanup = lifecycle.session.cleanup;
    const { baseUrl } = lifecycle;
    const failures: string[] = [];

    for (const probe of W20_FINAL_EVIDENCE_BROWSER_PROBES) {
      const url = `${baseUrl}${probe.path}`;

      try {
        const response = await httpGetText(url, FETCH_TIMEOUT_MS);

        if (response.status !== 200) {
          failures.push(`${probe.path}: HTTP ${response.status} from ${url}`);
          continue;
        }

        const html = response.body;
        if (html.length < 512) {
          failures.push(
            `${probe.path}: response too small (${html.length} bytes)`,
          );
        }

        for (const marker of probe.corpusMarkers) {
          if (!html.includes(marker)) {
            failures.push(`${probe.path}: missing corpus marker "${marker}"`);
          }
        }

        for (const marker of probe.noHostMarkers) {
          if (!html.includes(marker)) {
            failures.push(`${probe.path}: missing no-host marker "${marker}"`);
          }
        }

        // Static export must not depend on a live Factory host URL in HTML.
        if (
          /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/(?:api\/v1|factory)/i.test(
            html,
          )
        ) {
          failures.push(
            `${probe.path}: HTML appears to reference a live Factory host URL`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${probe.path}: fetch failed (${message})`);
      }
    }

    if (failures.length > 0) {
      console.error(
        [
          "W20 final-evidence browser verify failed:",
          ...failures.map((reason) => `  - ${reason}`),
          `Reproduce with: ${W20_FINAL_EVIDENCE_SUITE_COMMAND}`,
        ].join("\n"),
      );
    }

    expect(failures).toEqual([]);
  });
});
