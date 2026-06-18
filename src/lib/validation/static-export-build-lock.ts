import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const STATIC_EXPORT_BUILD_LOCK_DIR = ".static-export-build.lock";

function lockPath(repoRoot: string): string {
  return join(repoRoot, STATIC_EXPORT_BUILD_LOCK_DIR);
}

function pidFilePath(repoRoot: string): string {
  return join(lockPath(repoRoot), "pid");
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLockOwnerPid(repoRoot: string): number | undefined {
  try {
    const raw = readFileSync(pidFilePath(repoRoot), "utf8").trim();
    const pid = Number.parseInt(raw, 10);
    return Number.isFinite(pid) ? pid : undefined;
  } catch {
    return undefined;
  }
}

function removeStaleLockIfNeeded(repoRoot: string): void {
  const ownerPid = readLockOwnerPid(repoRoot);
  if (ownerPid === undefined || !isProcessAlive(ownerPid)) {
    rmSync(lockPath(repoRoot), { recursive: true, force: true });
  }
}

/** Waits for exclusive access to static export build artifacts. */
export function acquireStaticExportBuildLock(
  repoRoot: string,
  timeoutMs = 600_000,
): void {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    removeStaleLockIfNeeded(repoRoot);

    try {
      mkdirSync(lockPath(repoRoot));
      writeFileSync(pidFilePath(repoRoot), String(process.pid), "utf8");
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") {
        throw error;
      }
    }

    Bun.sleepSync(250);
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for static export build lock at ${lockPath(repoRoot)}`,
  );
}

/** Releases the static export build lock when held by the current process. */
export function releaseStaticExportBuildLock(repoRoot: string): void {
  const ownerPid = readLockOwnerPid(repoRoot);
  if (ownerPid !== undefined && ownerPid !== process.pid) {
    return;
  }

  rmSync(lockPath(repoRoot), { recursive: true, force: true });
}

/** Runs a static export build under an exclusive repo-root lock. */
export function withStaticExportBuildLock<T>(
  repoRoot: string,
  fn: () => T,
  timeoutMs = 600_000,
): T {
  acquireStaticExportBuildLock(repoRoot, timeoutMs);
  try {
    return fn();
  } finally {
    releaseStaticExportBuildLock(repoRoot);
  }
}
