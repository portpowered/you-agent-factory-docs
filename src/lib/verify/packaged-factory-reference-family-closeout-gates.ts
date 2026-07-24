/**
 * Batch 5 packaged-factory reference family closeout — story 007 proofs.
 *
 * Tip-owned evidence that:
 * - avoidable home/index (and related) import leakage stays fixed via the
 *   story 004 import-graph detectors (never raise budget ceilings to absorb)
 * - total-site budget ceilings remain locked at the converged tip baselines
 * - the PRD repository gate inventory (validate-data → ci) is catalogued for
 *   maintainer reproduction
 *
 * Does not redesign shared replay, corpus, or landing ownership. Does not
 * raise `FACTORY_EXPORTED_SITE_BUDGET_BASELINES`. Live `make *` gates are run
 * by the closeout executor; this module locks contracts and reuses tip proofs.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import {
  type ExportedSiteBudgetEvaluation,
  evaluateExportedSiteBudget,
  FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
} from "@/lib/build/exported-site-budget";
import { getProjectRoot } from "@/lib/content/content-paths";
import {
  type PackagedFactoryCloseoutImportGraphEvidence,
  provePackagedFactoryReferenceFamilyCloseoutImportGraphs,
} from "./packaged-factory-reference-family-closeout-import-graphs";

/**
 * Locked total-site ceilings for closeout. Must stay equal to
 * `FACTORY_EXPORTED_SITE_BUDGET_BASELINES` — do not raise these to paper over
 * packaged-factory / replay / generator import leakage.
 */
export const PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES = {
  maxTotalOutBytes: 385_000_000,
  maxNextStaticJsBytes: 15_000_000,
  maxSearchBootstrapBytes: 32_000_000,
} as const;

export type PackagedFactoryCloseoutGateFamily =
  | "import-leakage-isolation"
  | "budget-ceiling-lock"
  | "validate-data"
  | "linkcheck"
  | "check"
  | "build"
  | "a11y"
  | "budget"
  | "ci";

export type PackagedFactoryCloseoutCommandGate = {
  /** Shared Makefile target maintainers reproduce with. */
  makeTarget: string;
  /** Short label for evidence notes. */
  label: string;
  /** Gate families this command covers. */
  families: readonly PackagedFactoryCloseoutGateFamily[];
};

/**
 * PRD-ordered repository gate inventory for Batch 5 closeout story 007.
 * `make ci` is last because it already chains the earlier shared suites plus
 * additional required peers (see `MAKE_CI_PREREQUISITES`).
 */
export const PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES = [
  {
    makeTarget: "validate-data",
    label: "Content / registry validation",
    families: ["validate-data"],
  },
  {
    makeTarget: "linkcheck",
    label: "Link and anchor validation",
    families: ["linkcheck"],
  },
  {
    makeTarget: "check",
    label: "Typecheck + lint",
    families: ["check"],
  },
  {
    makeTarget: "build",
    label: "Static export to out/",
    families: ["build"],
  },
  {
    makeTarget: "a11y",
    label: "Critical-route accessibility suite",
    families: ["a11y"],
  },
  {
    makeTarget: "budget",
    label: "Total-site + focused payload budgets",
    families: ["budget", "budget-ceiling-lock"],
  },
  {
    makeTarget: "ci",
    label: "Full local required path (aligned with CI verify)",
    families: ["ci"],
  },
] as const satisfies readonly PackagedFactoryCloseoutCommandGate[];

/** Maintainer reproduction sequence printed on closeout gate failure. */
export const PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_GATE_COMMANDS =
  PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES.map(
    (gate) => `make ${gate.makeTarget}`,
  );

/**
 * Leakage-first remediation policy for closeout budget failures.
 * Budget ceilings must not be raised to absorb avoidable import leakage.
 */
export const PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY =
  "fix-import-leakage-before-raising-budget-ceilings" as const;

export const PACKAGED_FACTORY_CLOSEOUT_REQUIRED_GATE_FAMILIES = [
  "import-leakage-isolation",
  "budget-ceiling-lock",
  "validate-data",
  "linkcheck",
  "check",
  "build",
  "a11y",
  "budget",
  "ci",
] as const satisfies readonly PackagedFactoryCloseoutGateFamily[];

export type PackagedFactoryCloseoutBudgetLockEvidence = {
  readonly locked: typeof PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES;
  readonly live: typeof FACTORY_EXPORTED_SITE_BUDGET_BASELINES;
  readonly matchesLiveBaselines: true;
  readonly remediationPolicy: typeof PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY;
};

export type PackagedFactoryCloseoutGatesEvidence = {
  readonly commandGates: typeof PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES;
  readonly budgetLock: PackagedFactoryCloseoutBudgetLockEvidence;
  readonly importGraphs: PackagedFactoryCloseoutImportGraphEvidence;
  readonly budgetEvaluation: ExportedSiteBudgetEvaluation;
};

export class PackagedFactoryCloseoutGatesError extends Error {
  readonly code:
    | "budget-ceiling-inflated"
    | "budget-evaluation-failed"
    | "export-missing";

  constructor(
    code: PackagedFactoryCloseoutGatesError["code"],
    message: string,
  ) {
    super(message);
    this.name = "PackagedFactoryCloseoutGatesError";
    this.code = code;
  }
}

export type PackagedFactoryCloseoutBudgetBaselines = {
  readonly maxTotalOutBytes: number;
  readonly maxNextStaticJsBytes: number;
  readonly maxSearchBootstrapBytes: number;
};

/**
 * Fail closed when tip budget baselines diverge from the closeout lock
 * (ceiling inflation) or when the lock itself was quietly raised.
 */
export function assertPackagedFactoryCloseoutBudgetCeilingsLocked(
  liveBaselines: PackagedFactoryCloseoutBudgetBaselines = FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
  lockedBaselines: PackagedFactoryCloseoutBudgetBaselines = PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES,
): PackagedFactoryCloseoutBudgetLockEvidence {
  const dimensions = [
    "maxTotalOutBytes",
    "maxNextStaticJsBytes",
    "maxSearchBootstrapBytes",
  ] as const;

  for (const dimension of dimensions) {
    if (liveBaselines[dimension] !== lockedBaselines[dimension]) {
      throw new PackagedFactoryCloseoutGatesError(
        "budget-ceiling-inflated",
        [
          `Closeout budget ceiling drift on ${dimension}:`,
          `locked=${lockedBaselines[dimension]} live=${liveBaselines[dimension]}.`,
          `Remediation: ${PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY}.`,
          `Reproduce with: ${PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_GATE_COMMANDS.join(" && ")}`,
        ].join(" "),
      );
    }
  }

  return {
    locked: PACKAGED_FACTORY_CLOSEOUT_LOCKED_BUDGET_BASELINES,
    live: FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
    matchesLiveBaselines: true,
    remediationPolicy: PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY,
  };
}

/**
 * Evaluate total-site budgets against a trusted `out/` without raising ceilings.
 */
export function provePackagedFactoryCloseoutBudgetAgainstOut(options?: {
  outDir?: string;
  cwd?: string;
}): ExportedSiteBudgetEvaluation {
  const cwd = options?.cwd ?? getProjectRoot();
  const outDir = options?.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const absoluteOut = join(cwd, outDir);

  if (!existsSync(absoluteOut)) {
    throw new PackagedFactoryCloseoutGatesError(
      "export-missing",
      [
        `Trusted export directory missing at ${absoluteOut}.`,
        "Run `make build` before closeout budget proofs.",
        `Reproduce with: ${PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_GATE_COMMANDS.join(" && ")}`,
      ].join(" "),
    );
  }

  assertPackagedFactoryCloseoutBudgetCeilingsLocked();

  const evaluation = evaluateExportedSiteBudget({
    outDir,
    cwd,
    baselines: FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
  });

  if (!evaluation.ok) {
    throw new PackagedFactoryCloseoutGatesError(
      "budget-evaluation-failed",
      [
        "Closeout total-site budget evaluation failed.",
        ...evaluation.failures.map((failure) => failure.message),
        `Remediation: ${PACKAGED_FACTORY_CLOSEOUT_LEAKAGE_REMEDIATION_POLICY}.`,
        "Do not raise FACTORY_EXPORTED_SITE_BUDGET_BASELINES to absorb packaged-factory leakage.",
        `Reproduce with: make build && make budget`,
      ].join("\n"),
    );
  }

  return evaluation;
}

export function listPackagedFactoryCloseoutCoveredGateFamilies(): PackagedFactoryCloseoutGateFamily[] {
  const covered = new Set<PackagedFactoryCloseoutGateFamily>([
    "import-leakage-isolation",
    "budget-ceiling-lock",
  ]);
  for (const gate of PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES) {
    for (const family of gate.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}

/**
 * Tip-owned closeout proof for import-leakage isolation + locked budget ceilings
 * + trusted `out/` budget evaluation. Live Makefile gates are executed by the
 * closeout agent; this returns the tip contracts those gates must keep green.
 */
export async function provePackagedFactoryReferenceFamilyCloseoutGates(options?: {
  projectRoot?: string;
  outDir?: string;
}): Promise<PackagedFactoryCloseoutGatesEvidence> {
  const projectRoot = options?.projectRoot ?? getProjectRoot();
  const budgetLock = assertPackagedFactoryCloseoutBudgetCeilingsLocked();
  const importGraphs =
    await provePackagedFactoryReferenceFamilyCloseoutImportGraphs({
      projectRoot,
    });
  const budgetEvaluation = provePackagedFactoryCloseoutBudgetAgainstOut({
    cwd: projectRoot,
    outDir: options?.outDir,
  });

  return {
    commandGates: PACKAGED_FACTORY_CLOSEOUT_REPOSITORY_COMMAND_GATES,
    budgetLock,
    importGraphs,
    budgetEvaluation,
  };
}
