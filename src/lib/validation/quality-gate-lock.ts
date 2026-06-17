import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const QUALITY_GATE_LOCK_DIR = ".quality-gate.lock";
const reentrantLockDepthByRepoRoot = new Map<string, number>();

function lockPath(repoRoot: string): string {
  return join(repoRoot, QUALITY_GATE_LOCK_DIR);
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

export function acquireQualityGateLock(
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
    `Timed out after ${timeoutMs}ms waiting for quality gate lock at ${lockPath(repoRoot)}`,
  );
}

export function releaseQualityGateLock(repoRoot: string): void {
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

export function withQualityGateLock<T>(
  repoRoot: string,
  fn: () => T,
  timeoutMs = 600_000,
): T {
  acquireQualityGateLock(repoRoot, timeoutMs);
  try {
    return fn();
  } finally {
    releaseQualityGateLock(repoRoot);
  }
}
