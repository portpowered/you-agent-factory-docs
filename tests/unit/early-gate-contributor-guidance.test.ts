import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFERRED_PHASE_8_QUALITY_CHECKS } from "../../src/lib/quality-gate/deferred-phase8";

const repoRoot = join(import.meta.dir, "../..");
const readmePath = join(repoRoot, "README.md");

describe("early gate contributor guidance", () => {
  test("readme identifies make quality-gate as the authoritative verification path", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toMatch(/make quality-gate/);
    expect(readme).toMatch(/\.github\/workflows\/ci\.yml/);
    expect(readme).toMatch(/typecheck/);
    expect(readme).toMatch(/lint/);
    expect(readme).toMatch(/localization validation/);
    expect(readme).toMatch(/content validation/);
    expect(readme).toMatch(/accessibility/);
    expect(readme).toMatch(/static export/);
    expect(readme).toMatch(/not substitutes for `make quality-gate`/);
  });

  test("readme documents deferred phase 8 checks excluded from the early gate", () => {
    const readme = readFileSync(readmePath, "utf8");

    for (const deferredCheck of DEFERRED_PHASE_8_QUALITY_CHECKS) {
      expect(readme).toContain(deferredCheck);
    }
  });
});
