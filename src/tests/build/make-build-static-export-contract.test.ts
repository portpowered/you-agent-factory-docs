import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getStaticExportBuildBunTestTimeoutMs } from "@/lib/build/run-static-export-build";
import { verifyStaticExportOutDir } from "@/lib/build/verify-static-export-out-dir";

const repoRoot = join(import.meta.dir, "../../..");
const outDir = join(repoRoot, "out");
const nextDir = join(repoRoot, ".next");

describe("make build static export contract", () => {
  test("verify-static-export-out-dir fails clearly when out/ is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "verify-static-export-out-"));
    const result = verifyStaticExportOutDir(dir, "out");

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.reason).toContain("Missing static export directory");

    rmSync(dir, { recursive: true, force: true });
  });

  test("verify-static-export-out-dir script exits non-zero when out/ is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "verify-static-export-script-"));
    const missingOutDir = join(dir, "missing-out");

    const result = spawnSync(
      "bun",
      [
        join(repoRoot, "scripts/verify-static-export-out-dir.ts"),
        missingOutDir,
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr ?? "").toContain(
      "Static export output verification failed",
    );
    expect(result.stderr ?? "").toContain("Missing static export directory");

    rmSync(dir, { recursive: true, force: true });
  });

  test(
    "make build produces out/ suitable for GitHub Pages upload",
    () => {
      if (existsSync(outDir)) {
        rmSync(outDir, { recursive: true, force: true });
      }
      if (existsSync(nextDir)) {
        rmSync(nextDir, { recursive: true, force: true });
      }

      const result = spawnSync("make", ["build"], {
        cwd: repoRoot,
        encoding: "utf8",
        env: process.env,
      });

      expect(result.status).toBe(0);
      expect(result.stderr ?? "").not.toContain("Error");
      expect(existsSync(outDir)).toBe(true);
      expect(existsSync(join(outDir, "index.html"))).toBe(true);

      const verification = verifyStaticExportOutDir(repoRoot);
      expect(verification.ok).toBe(true);
    },
    getStaticExportBuildBunTestTimeoutMs(),
  );
});
