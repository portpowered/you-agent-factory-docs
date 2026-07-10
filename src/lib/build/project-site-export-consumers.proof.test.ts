import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { runStaticExportBuild } from "@/lib/build/run-static-export-build";
import { verifyProjectSiteExportDirectory } from "@/lib/build/verify-project-site-export-consumers";

/** Full Next export + traces regularly exceeds the shared 10-minute build-test ceiling. */
const PROJECT_SITE_EXPORT_PROOF_TIMEOUT_MS = 1_800_000;

/**
 * Direct project-site export proof for runtime path consumers.
 * Builds with GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs when needed and
 * asserts no root /_next, prefixed search bootstrap, and home/docs/blog links
 * inside the project site — without post-build HTML rewriting.
 */
describe("project-site export consumers proof", () => {
  test(
    "GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs export honors runtime path consumers",
    () => {
      const repoRoot = process.cwd();
      const basePath = BUILT_APP_GITHUB_PAGES_BASE_PATH;

      let verification = verifyProjectSiteExportDirectory({
        basePath,
        outDir: "out",
        cwd: repoRoot,
      });

      if (!verification.ok) {
        const buildResult = runStaticExportBuild({
          cwd: repoRoot,
          env: { GITHUB_PAGES_BASE_PATH: basePath },
        });
        expect(buildResult.status).toBe(0);

        verification = verifyProjectSiteExportDirectory({
          basePath,
          outDir: "out",
          cwd: repoRoot,
        });
      }

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
    },
    PROJECT_SITE_EXPORT_PROOF_TIMEOUT_MS,
  );
});
