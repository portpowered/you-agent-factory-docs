/**
 * W20 story 007: verify a trusted project-site `out/` after the Pages-prefixed
 * rebuild + deployed-artifact guard command gates. Fails closed when `out/`
 * is missing or still unprefixed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import { verifyProjectSiteExportDirectory } from "@/lib/build/verify-project-site-export-consumers";
import {
  W20_PAGES_PREFIXED_BASE_PATH,
  W20_PAGES_PREFIXED_SUITE_COMMAND,
} from "./w20-pages-prefixed-export-convergence";

const repoRoot = join(import.meta.dir, "../../..");
const outDir = join(repoRoot, DEFAULT_EXPORT_OUT_DIR);

describe("W20 pages-prefixed export out/ verify", () => {
  test("trusted out/ honors project-site prefix consumers", () => {
    expect(existsSync(outDir)).toBe(true);

    const verification = verifyProjectSiteExportDirectory({
      basePath: W20_PAGES_PREFIXED_BASE_PATH,
      outDir: DEFAULT_EXPORT_OUT_DIR,
      cwd: repoRoot,
    });

    if (!verification.ok) {
      throw new Error(
        [
          verification.reason,
          `Reproduce with: ${W20_PAGES_PREFIXED_SUITE_COMMAND}`,
          "or:",
          `GITHUB_PAGES_BASE_PATH=${W20_PAGES_PREFIXED_BASE_PATH} make build`,
          "make guard-pages-deployed-artifact",
        ].join("\n"),
      );
    }

    expect(verification.evaluation.hasPrefixedNextAssets).toBe(true);
    expect(verification.evaluation.hasRootLevelNextAssets).toBe(false);
    expect(verification.evaluation.hasPrefixedNavigation).toBe(true);
    expect(verification.evaluation.hasPrefixedSearchBootstrap).toBe(true);
    expect(verification.evaluation.hasUnprefixedSearchBootstrap).toBe(false);
  });
});
