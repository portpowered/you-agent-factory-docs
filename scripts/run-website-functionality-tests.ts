import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { resolveWebsiteTestParallelWorkers } from "../src/lib/verify/website-test-workers";
import { isWebsiteFunctionalityExcluded } from "../src/lib/website-functionality-exclusions";

const repoRoot = join(import.meta.dir, "..");
/**
 * Keep plain `make test` aligned with the CI matrix default. The website suite
 * contains many heavyweight server-render and search rows that are stable under
 * the serialized worker budget used in CI, but can time out locally when Bun
 * fans them back out across multiple shards by default.
 */
const defaultParallelWorkers = 1;
/** Match bunfig.toml [test] / [test.ci]; explicit CLI flag survives spawned shards. */
const websiteTestTimeoutMs = 900_000;

/**
 * Exclusion inventory (active / replaced) lives in
 * `src/lib/website-functionality-exclusions.ts`. Obsolete Atlas package
 * prefixes and missing-path skips were removed in
 * restore-required-tests-gates-001.
 */

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function listTestFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "out" ||
      entry.name === ".claude" ||
      entry.name === ".playwright-mcp" ||
      entry.name === ".source" ||
      entry.name === ".git"
    ) {
      continue;
    }

    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTestFiles(fullPath));
      continue;
    }

    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function isExcluded(relativePath: string): boolean {
  return isWebsiteFunctionalityExcluded(relativePath);
}

function resolveShardWorkers(): number {
  return resolveWebsiteTestParallelWorkers({
    defaultWorkers: defaultParallelWorkers,
  });
}

function runBunTestShard(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "bun",
      [
        "test",
        "--timeout",
        String(websiteTestTimeoutMs),
        "--preload",
        "./src/tests/a11y/mock-navigation.ts",
        ...args,
      ],
      {
        cwd: repoRoot,
        stdio: "inherit",
        env: process.env,
      },
    );

    child.once("error", reject);
    child.once("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

function distributeAcrossShards(
  files: string[],
  shardCount: number,
): string[][] {
  const shards = Array.from({ length: shardCount }, () => [] as string[]);

  files.forEach((file, index) => {
    shards[index % shardCount]?.push(file);
  });

  return shards.filter((shard) => shard.length > 0);
}

const testFiles = listTestFiles(repoRoot)
  .map((filePath) => normalizePath(relative(repoRoot, filePath)))
  .filter((relativePath) => !isExcluded(relativePath))
  .sort();

const WEBSITE_FUNCTIONALITY_SUITE_COMMAND = "make test";

if (testFiles.length === 0) {
  console.error("No website functionality test files found.");
  console.error(
    `Reproduce locally with: ${WEBSITE_FUNCTIONALITY_SUITE_COMMAND}`,
  );
  process.exit(1);
}

const shards = distributeAcrossShards(testFiles, resolveShardWorkers());
const statuses = await Promise.all(
  shards.map((shard) => runBunTestShard(shard)),
);
const failingStatus = statuses.find((status) => status !== 0);
if (failingStatus !== undefined) {
  console.error(
    `website functionality suite failed. Reproduce locally with: ${WEBSITE_FUNCTIONALITY_SUITE_COMMAND}`,
  );
  process.exit(failingStatus);
}

process.exit(0);
