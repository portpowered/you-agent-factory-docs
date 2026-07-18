/**
 * Regenerates W00 contract-inventory fixtures under
 * `docs/temp/references/fixtures/` from the installed
 * `@you-agent-factory/api` package artifacts.
 *
 * Counts and membership lists are baseline observations for drift detection,
 * not permanent product limits or UI quotas. Re-run after package upgrades:
 *
 *   bun ./scripts/regenerate-w00-reference-baseline-fixtures.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveW00BaselineInventories,
  W00_FIXTURE_FILE_NAMES,
} from "../src/lib/references/w00-baseline-inventory";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const fixturesDir = join(repoRoot, "docs/temp/references/fixtures");

function writeJson(fileName: string, value: unknown): void {
  const path = join(fixturesDir, fileName);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function formatFixturesWithBiome(): void {
  // Match repo Biome JSON formatting so `make check` stays green after regen.
  const format = Bun.spawnSync({
    cmd: [
      "bunx",
      "biome",
      "check",
      "--write",
      "--files-ignore-unknown=true",
      fixturesDir,
    ],
    cwd: repoRoot,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (format.exitCode !== 0) {
    throw new Error("biome formatting of W00 fixtures failed");
  }
}

function main(): void {
  mkdirSync(fixturesDir, { recursive: true });
  const inventories = deriveW00BaselineInventories();
  for (const fileName of W00_FIXTURE_FILE_NAMES) {
    writeJson(fileName, inventories[fileName]);
  }
  formatFixturesWithBiome();
  console.log(`regenerated fixtures in ${fixturesDir}`);
}

main();
