/** Deferred quality checks intentionally excluded from the early foundation gate. */
export const DEFERRED_PHASE_8_QUALITY_CHECKS = [
  "broad package coverage policy enforcement",
  "launch-content completeness enforcement",
  "broader route coverage and richer performance instrumentation beyond the current narrow budget gate",
] as const;

export type DeferredPhase8QualityCheck =
  (typeof DEFERRED_PHASE_8_QUALITY_CHECKS)[number];
