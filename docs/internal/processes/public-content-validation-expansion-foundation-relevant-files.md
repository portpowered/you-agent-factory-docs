# Public Content Validation Expansion Foundation Relevant Files

- `src/lib/content/public-content.ts`
  - Canonical supported public content kinds and the checked-in fixture graph used by the validation lane.
- `src/lib/content/public-content-validation.ts`
  - Pure validation contract for public content graph coverage and maintainer-facing failure messages.
- `scripts/validate-public-content.ts`
  - CLI entrypoint for running the public content validation lane outside the test harness.
- `tests/unit/public-content-validation.test.ts`
  - Reviewer-visible proof that docs, blog, glossary, comparison, and reference all participate in the same validation contract.
