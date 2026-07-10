import { describe, expect, test } from "bun:test";
import { acquireTrustedProjectSiteExport } from "@/lib/build/acquire-trusted-project-site-export";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { verifyProjectSiteExportDirectory } from "@/lib/build/verify-project-site-export-consumers";

/** Full Next export + traces regularly exceeds the shared 10-minute build-test ceiling. */
const PROJECT_SITE_EXPORT_PROOF_TIMEOUT_MS = 1_800_000;

/**
 * Direct project-site export proof for runtime path consumers.
 *
 * Reuses one trusted project-site `out/` via `acquireTrustedProjectSiteExport`
 * when a matching export is already present; builds at most once when missing
 * or mismatched. Does not launch a competing full export solely to re-prove a
 * matching artifact.
 */
describe("project-site export consumers proof", () => {
  test(
    "GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs export honors runtime path consumers",
    () => {
      const repoRoot = process.cwd();
      const basePath = BUILT_APP_GITHUB_PAGES_BASE_PATH;

      const acquired = acquireTrustedProjectSiteExport({
        cwd: repoRoot,
        outDir: "out",
        basePath,
      });

      const verification = verifyProjectSiteExportDirectory({
        basePath: acquired.basePath,
        outDir: acquired.outDir,
        cwd: repoRoot,
      });

      expect(verification).toMatchObject({ ok: true });
      if (verification.ok) {
        expect(verification.evaluation.hasPrefixedNextAssets).toBe(true);
        expect(verification.evaluation.hasRootLevelNextAssets).toBe(false);
        expect(verification.evaluation.hasPrefixedNavigation).toBe(true);
        expect(verification.evaluation.hasPrefixedSearchBootstrap).toBe(true);
        expect(verification.evaluation.hasUnprefixedSearchBootstrap).toBe(
          false,
        );
      } else {
        throw new Error(verification.reason);
      }

      // When a matching trusted export already existed, acquisition must report
      // reuse (no competing full static export for this proof alone).
      if (acquired.source === "reused") {
        expect(acquired.outDir).toBe("out");
      }
    },
    PROJECT_SITE_EXPORT_PROOF_TIMEOUT_MS,
  );
});
