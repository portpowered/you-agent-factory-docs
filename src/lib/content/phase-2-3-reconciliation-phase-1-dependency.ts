/**
 * Phase 2/3 reconciliation dependency notes after Atlas/Phase-1 verifier deletion.
 * Story 013 records assessment only — do not implement repairs here.
 *
 * Human-readable detail: docs/phase-2-3-reconciliation-implementation-notes.md
 */

export const PHASE_2_3_RECONCILIATION_IMPLEMENTATION_NOTES_PATH =
  "docs/phase-2-3-reconciliation-implementation-notes.md";

/** Reconciliation does not block on open static-export search repair (verified 2026-06-09 UTC). */
export const PHASE_2_3_RECONCILIATION_DEPENDS_ON_PHASE_1_STATIC_EXPORT_REPAIR = false;

/**
 * Path prefixes formerly owned by Phase 1 static-export search repair.
 * Those Atlas/Phase-1 verifier scripts were deleted with rewrite-delete-atlas-domain;
 * keep the prefixes as historical ownership notes only.
 */
export const PHASE_1_STATIC_EXPORT_REPAIR_OWNED_PATH_PREFIXES = [
  "src/lib/verify/static-export-",
  "src/tests/build/static-export-",
] as const;

export type Phase23ResidualPhase1Blocker = {
  track: "phase-1-built-app-convergence";
  summary: string;
  exampleCheckIds: readonly string[];
  verificationCommands: readonly string[];
};

/**
 * Residual Phase 1 concerns after Atlas verifier deletion. Required CI paths are
 * `make check` / `make test` / `make build` only.
 */
export const PHASE_2_3_RECONCILIATION_RESIDUAL_PHASE_1_BLOCKERS: readonly Phase23ResidualPhase1Blocker[] =
  [
    {
      track: "phase-1-built-app-convergence",
      summary:
        "Former Phase 1 built-app / Atlas built-route verifiers were retired; do not reintroduce them into required make targets.",
      exampleCheckIds: [
        "grouped-query-attention-built-route-convergence",
        "phase-1-site-routes-unified-shell",
      ],
      verificationCommands: ["make build", "make test", "make check"],
    },
  ] as const;

export const PHASE_2_3_RECONCILIATION_RECOMMENDED_FOLLOW_UP = {
  workItemKind: "empty-shell-rewrite-follow-up",
  summary:
    "Continue empty-shell rewrite stories (remaining Atlas feature packages, then end-to-end make check/test/build proof) without restoring deleted Atlas verifiers.",
  referenceDocs: [PHASE_2_3_RECONCILIATION_IMPLEMENTATION_NOTES_PATH],
} as const;
