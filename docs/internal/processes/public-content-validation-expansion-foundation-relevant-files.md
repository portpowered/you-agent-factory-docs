# Public Content Validation Expansion Foundation Relevant Files

- `src/lib/content/public-content.ts`
  - Canonical supported public content kinds plus the typed fixture graph of canonical records, localized variants, and generated localized search documents used by the validation lane.
- `src/lib/content/public-content-validation.ts`
  - Pure validation contract for kind coverage, canonical-id uniqueness, kind-aware route or slug identity collisions, localized-variant integrity, localized-search-artifact drift, and maintainer-facing failure messages.
- `scripts/validate-public-content.ts`
  - CLI entrypoint for running the public content validation lane against both the validated content graph and the generated localized search artifact outside the test harness.
- `src/lib/quality/make-check.ts`
  - Shared make-driven quality-gate runner that stages content validation ahead of typecheck and lint and preserves explicit maintainer-facing failure reasons for each step.
- `scripts/run-check.ts`
  - Thin IO entrypoint behind `make check` that executes the staged quality gate and mirrors the content-validation failure output into the standard developer and CI command path.
- `tests/unit/public-content-validation.test.ts`
  - Reviewer-visible proof that docs, blog, glossary, comparison, and reference all participate in the same validation contract, that canonical, route-identity, localized-variant, and generated-artifact drift failures are explicit, and that `make check` reports content-validation failures distinctly from later static-analysis stages.
