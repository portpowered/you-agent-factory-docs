/**
 * Exported-site budget CLI: measure the existing trusted/static `out/` against
 * factory baselines. Does not launch a competing full static export — CI and
 * deploy-pages run `make build` before `make budget`.
 *
 * Invoked by `make budget` / `bun run budget`.
 */
import {
  evaluateExportedSiteBudget,
  formatExportedSiteBudgetFailureReport,
  formatExportedSiteBudgetPassReport,
} from "../src/lib/build/exported-site-budget";

function main(): void {
  const evaluation = evaluateExportedSiteBudget();

  if (!evaluation.ok) {
    console.error(formatExportedSiteBudgetFailureReport(evaluation));
    process.exit(1);
  }

  console.log(formatExportedSiteBudgetPassReport(evaluation));
  process.exit(0);
}

main();
