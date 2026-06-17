import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { withTypecheckLock } from "@/lib/validation/typecheck-lock";

const repoRoot = join(import.meta.dir, "..");

function runCommand(label: string, args: string[]): void {
  console.log(label);

  const result = spawnSync("bun", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

withTypecheckLock(repoRoot, () => {
  runCommand("next typegen", ["x", "next", "typegen"]);
  runCommand("tsc --noEmit", ["x", "tsc", "--noEmit"]);
});
