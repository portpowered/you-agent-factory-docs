/**
 * Exported-site budget CLI: measure the existing trusted/static `out/` against
 * factory baselines, then enforce W19 focused API/events/schema page payload
 * ceilings. Does not launch a competing full static export — CI and
 * deploy-pages run `make build` before `make budget`.
 *
 * Invoked by `make budget` / `bun run budget`.
 */
import {
  evaluateExportedSiteBudget,
  formatExportedSiteBudgetFailureReport,
  formatExportedSiteBudgetPassReport,
} from "../src/lib/build/exported-site-budget";
import {
  evaluateReferencePayloadBudgets,
  formatReferencePayloadBudgetFailureReport,
  formatReferencePayloadBudgetPassReport,
} from "../src/lib/verify/a11y-reference-payload-budget";

function main(): void {
  const evaluation = evaluateExportedSiteBudget();

  if (!evaluation.ok) {
    console.error(formatExportedSiteBudgetFailureReport(evaluation));
    process.exit(1);
  }

  console.log(formatExportedSiteBudgetPassReport(evaluation));

  const focused = evaluateReferencePayloadBudgets();
  if (!focused.ok) {
    console.error(formatReferencePayloadBudgetFailureReport(focused));
    process.exit(1);
  }

  console.log(formatReferencePayloadBudgetPassReport(focused));
  process.exit(0);
}

main();
