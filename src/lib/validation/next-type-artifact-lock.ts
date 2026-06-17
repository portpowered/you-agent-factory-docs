import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const NEXT_TYPE_ARTIFACT_LOCK_DIR = ".next-type-artifact.lock";
const reentrantLockDepthByRepoRoot = new Map<string, number>();

function lockPath(repoRoot: string): string {
  return join(repoRoot, NEXT_TYPE_ARTIFACT_LOCK_DIR);
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

/** Waits for exclusive access to generated Next.js type artifacts under .next/. */
export function acquireNextTypeArtifactLock(
  repoRoot: string,
  timeoutMs = 600_000,
): void {
  const currentDepth = reentrantLockDepthByRepoRoot.get(repoRoot);
  if (currentDepth !== undefined) {
    reentrantLockDepthByRepoRoot.set(repoRoot, currentDepth + 1);
    return;
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (readLockOwnerPid(repoRoot) === process.pid) {
      reentrantLockDepthByRepoRoot.set(repoRoot, 1);
      return;
    }

    removeStaleLockIfNeeded(repoRoot);

    try {
      mkdirSync(lockPath(repoRoot));
      writeFileSync(pidFilePath(repoRoot), String(process.pid), "utf8");
      reentrantLockDepthByRepoRoot.set(repoRoot, 1);
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
    `Timed out after ${timeoutMs}ms waiting for Next type artifact lock at ${lockPath(repoRoot)}`,
  );
}

/** Releases the Next.js type artifact lock when held by the current process. */
export function releaseNextTypeArtifactLock(repoRoot: string): void {
  const currentDepth = reentrantLockDepthByRepoRoot.get(repoRoot);
  if (currentDepth !== undefined) {
    if (currentDepth > 1) {
      reentrantLockDepthByRepoRoot.set(repoRoot, currentDepth - 1);
      return;
    }

    reentrantLockDepthByRepoRoot.delete(repoRoot);
  }

  const ownerPid = readLockOwnerPid(repoRoot);
  if (ownerPid !== undefined && ownerPid !== process.pid) {
    return;
  }

  rmSync(lockPath(repoRoot), { recursive: true, force: true });
}

/** Runs a callback under an exclusive repo-root lock for Next.js type artifacts. */
export function withNextTypeArtifactLock<T>(
  repoRoot: string,
  fn: () => T,
  timeoutMs = 600_000,
): T {
  acquireNextTypeArtifactLock(repoRoot, timeoutMs);
  try {
    return fn();
  } finally {
    releaseNextTypeArtifactLock(repoRoot);
  }
}
