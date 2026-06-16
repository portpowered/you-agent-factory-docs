import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const lockDir = join(repoRoot, ".build-lock");
const lockPidFile = join(lockDir, "pid");
const maxWaitMs = 15 * 60 * 1000;
const pollMs = 200;

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock(): void {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    try {
      mkdirSync(lockDir);
      writeFileSync(lockPidFile, String(process.pid), "utf8");
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") {
        throw error;
      }

      if (existsSync(lockPidFile)) {
        const pid = Number.parseInt(readFileSync(lockPidFile, "utf8"), 10);
        if (!Number.isNaN(pid) && !isPidAlive(pid)) {
          rmSync(lockDir, { recursive: true, force: true });
          continue;
        }
      }

      Bun.sleepSync(pollMs);
    }
  }

  throw new Error("Timed out waiting for static export build lock");
}

function releaseLock(): void {
  rmSync(lockDir, { recursive: true, force: true });
}

function runBuild(): number {
  acquireLock();

  try {
    rmSync(join(repoRoot, ".next"), { recursive: true, force: true });

    const result = spawnSync("bun", ["run", "build"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: process.env,
      stdio: "inherit",
    });

    if ((result.status ?? 1) !== 0) {
      return result.status ?? 1;
    }

    if (!existsSync(join(repoRoot, "out"))) {
      console.error("Static export output missing: expected out/ after build");
      return 1;
    }

    return 0;
  } finally {
    releaseLock();
  }
}

process.exit(runBuild());
