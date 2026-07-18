import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  W20_PAGES_PREFIXED_COMMAND_GATES,
  W20_PAGES_PREFIXED_POST_COMMAND_SUITE_PATHS,
  W20_PAGES_PREFIXED_REQUIRED_TEST_PATHS,
  W20_PAGES_PREFIXED_SUITE_COMMAND,
} from "../src/lib/verify/w20-pages-prefixed-export-convergence";

const repoRoot = join(import.meta.dir, "..");

if (W20_PAGES_PREFIXED_REQUIRED_TEST_PATHS.length === 0) {
  console.error(
    "W20 pages-prefixed export required suite is empty — refusing to skip.",
  );
  process.exit(1);
}

const catalogResult = spawnSync(
  "bun",
  ["test", "src/lib/verify/w20-pages-prefixed-export-convergence.test.ts"],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((catalogResult.status ?? 1) !== 0) {
  console.error(
    `W20 pages-prefixed export catalog proof failed. Reproduce with: ${W20_PAGES_PREFIXED_SUITE_COMMAND}`,
  );
  process.exit(catalogResult.status ?? 1);
}

for (const gate of W20_PAGES_PREFIXED_COMMAND_GATES) {
  const result = spawnSync("make", [gate.makeTarget], {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      ...gate.env,
    },
  });

  if ((result.status ?? 1) !== 0) {
    const envHint =
      Object.keys(gate.env).length > 0
        ? `${Object.entries(gate.env)
            .map(([key, value]) => `${key}=${value}`)
            .join(" ")} `
        : "";
    console.error(
      `W20 pages-prefixed command gate "${gate.makeTarget}" failed. Reproduce locally with: ${envHint}make ${gate.makeTarget}`,
    );
    process.exit(result.status ?? 1);
  }
}

const suiteResult = spawnSync(
  "bun",
  ["test", ...W20_PAGES_PREFIXED_POST_COMMAND_SUITE_PATHS],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if ((suiteResult.status ?? 1) !== 0) {
  console.error(
    `W20 pages-prefixed post-guard suite failed. Reproduce locally with: ${W20_PAGES_PREFIXED_SUITE_COMMAND}`,
  );
}

process.exit(suiteResult.status ?? 1);
