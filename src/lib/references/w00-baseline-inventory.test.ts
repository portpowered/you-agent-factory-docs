/**
 * Focused W00 fixture drift tests.
 *
 * Recomputes key inventory signals from the installed `@you-agent-factory/api`
 * package and compares them to committed fixtures under
 * `docs/temp/references/fixtures/`. A mismatch means the installed package
 * drifted relative to the published baseline — regenerate fixtures and update
 * `baseline.md`. Counts are observations for drift detection, not permanent
 * product limits or UI quotas.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  deriveW00BaselineInventories,
  W00_BASELINE_OBSERVATION_NOTE,
  W00_FIXTURE_FILE_NAMES,
  type W00FixtureFileName,
} from "@/lib/references/w00-baseline-inventory";

const repoRoot = resolve(import.meta.dir, "../../..");
const fixturesDir = join(repoRoot, "docs/temp/references/fixtures");

function loadCommittedFixture(fileName: W00FixtureFileName): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, fileName), "utf8"));
}

describe("W00 reference baseline inventory fixtures", () => {
  test("observation policy states counts are drift observations, not product limits", () => {
    expect(W00_BASELINE_OBSERVATION_NOTE).toContain("drift detection");
    expect(W00_BASELINE_OBSERVATION_NOTE).toContain(
      "not permanent product limits",
    );

    for (const fileName of W00_FIXTURE_FILE_NAMES) {
      const fixture = loadCommittedFixture(fileName) as {
        baselineObservationNote?: string;
      };
      expect(fixture.baselineObservationNote).toBe(
        W00_BASELINE_OBSERVATION_NOTE,
      );
    }
  });

  test("committed fixtures match inventories recomputed from the installed API package", () => {
    const live = deriveW00BaselineInventories();

    for (const fileName of W00_FIXTURE_FILE_NAMES) {
      const committed = loadCommittedFixture(fileName);
      expect(committed).toEqual(live[fileName]);
    }
  });

  test("SSE presentation roles keep global /events compatibility-only", () => {
    const live = deriveW00BaselineInventories()["sse-inventory.json"];
    expect(live.presentationRules.globalEventsNeverPreferredOrCanonical).toBe(
      true,
    );
    expect(live.presentationRules.compatibilityOnlyEventsPath).toBe("/events");
    expect(live.presentationRules.canonicalSessionEventsPath).toBe(
      "/factory-sessions/{session_id}/events",
    );

    const byPath = Object.fromEntries(
      live.streams.map((stream) => [stream.path, stream]),
    );
    expect(byPath["/events"]?.role).toBe("compatibility-only");
    expect(byPath["/events"]?.preferredOrCanonical).toBe(false);
    expect(byPath["/factory-sessions/{session_id}/events"]?.role).toBe(
      "canonical",
    );
    expect(
      byPath["/factory-sessions/{session_id}/events"]?.preferredOrCanonical,
    ).toBe(true);
    expect(byPath["/factory-sessions/{session_id}/response-events"]?.role).toBe(
      "ephemeral",
    );
  });
});
