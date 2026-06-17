# Public Content Validation Expansion Foundation Relevant Files

- `src/lib/content/public-content.ts`
  - Canonical supported public content kinds plus the typed fixture graph of canonical records and localized variants used by the validation lane.
- `src/lib/content/public-content-validation.ts`
  - Pure validation contract for kind coverage, canonical-id uniqueness, kind-aware route or slug identity collisions, localized-variant integrity, and maintainer-facing failure messages.
- `scripts/validate-public-content.ts`
  - CLI entrypoint for running the public content validation lane outside the test harness.
- `tests/unit/public-content-validation.test.ts`
  - Reviewer-visible proof that docs, blog, glossary, comparison, and reference all participate in the same validation contract and that canonical, route-identity, and localized-variant failures are explicit.
