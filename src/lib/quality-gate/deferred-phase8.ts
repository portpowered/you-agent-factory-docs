/** Deferred quality checks intentionally excluded from the early foundation gate. */
export const DEFERRED_PHASE_8_QUALITY_CHECKS = [
  "deploy-on-main automation",
  "Lighthouse performance and accessibility budgets",
  "broad package coverage policy enforcement",
  "full search-index validation",
  "launch-content completeness enforcement",
] as const;

export type DeferredPhase8QualityCheck =
  (typeof DEFERRED_PHASE_8_QUALITY_CHECKS)[number];
