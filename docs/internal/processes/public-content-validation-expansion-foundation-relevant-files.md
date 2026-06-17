# Public Content Validation Expansion Foundation Relevant Files

- `src/lib/content/public-content.ts`
  - Canonical supported public content kinds plus the typed fixture graph of canonical records, localized variants, and generated localized search documents used by the validation lane.
- `src/lib/content/public-content-validation.ts`
  - Pure validation contract for kind coverage, canonical-id uniqueness, kind-aware route or slug identity collisions, localized-variant integrity, localized-search-artifact drift, and maintainer-facing failure messages.
- `scripts/validate-content.ts`
  - Shared content-validation CLI entrypoint that runs both the starter-content checks and the expanded public-content graph plus localized-search-artifact validation lane.
- `src/lib/validation/gate-fixtures.ts`
  - Test-only fixture seam for subprocess proof that `validate:content` fails clearly on public-content graph or generated-artifact drift.
- `tests/unit/public-content-validation.test.ts`
  - Reviewer-visible proof that docs, blog, glossary, comparison, and reference all participate in the same validation contract, that canonical, route-identity, localized-variant, and generated-artifact drift failures are explicit, and that the shared `validate:content` command fails clearly on public-content regressions.
