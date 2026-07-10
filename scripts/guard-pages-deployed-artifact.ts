/**
 * Deploy-path Pages guard CLI: reuse the existing project-site `out/` and
 * HTTP-probe it. Never runs a second full static export (`allowBuild: false`).
 *
 * Invoked by `make guard-pages-deployed-artifact` after `make build` in
 * `.github/workflows/deploy-pages.yml`, before `upload-pages-artifact`.
 */
import { guardPagesDeployedArtifact } from "../src/lib/build/guard-pages-deployed-artifact";
import { formatGuardPagesDeployedArtifactFailureReport } from "../src/lib/build/required-read-only-export-probes";

async function main(): Promise<void> {
  const result = await guardPagesDeployedArtifact();

  if (!result.ok) {
    console.error(formatGuardPagesDeployedArtifactFailureReport(result.reason));
    process.exit(1);
  }

  console.log(
    `Pages deployed-artifact guard passed (source=${result.acquired.source}, out=${result.acquired.outDir}, basePath=${result.acquired.basePath}).`,
  );
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
