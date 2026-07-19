# Ontology Classification Relevant Files

Use these files when changing the ontology classification namespace contract or
the temporary legacy-id bridge.

## Core contract

* `src/content/registry/classifications/*.json`
  Canonical classification records, explicit `parentClassificationId` edges,
  and any temporary `legacyIds` aliases.
* `src/lib/content/registry.ts`
  Registry loading and validation, including duplicate legacy-id protection and
  ontology-first content checks.
* `src/lib/content/registry-core.ts`
  Independent import surface for base registry contracts (status, kind, base
  record, tag, citation, classification, ontology relationship schemas/types).
  Shell code that only needs shared registry concepts should import from here
  instead of `schemas.ts`, which also owns AI-domain record extensions.
* `src/lib/content/schemas.ts`
  Compatibility re-export layer for existing consumers; composes AI-domain record
  schemas on top of `registry-core` shapes.
* `src/lib/content/schemas-compat.test.ts`
  Behavioral proof that `schemas.ts` re-exports core contracts from
  `registry-core` without duplicated definitions and that AI-domain registry
  union exports remain available to existing consumers.
* `src/lib/content/registry-ai-domain-validation.test.ts`
  Behavioral proof that published registry fixture records still parse through
  existing `schemas.ts` exports and that `loadRegistry` indexes representative
  AI-domain entries unchanged after the core type split.
* `src/lib/content/registry-loader-error-compat.test.ts`
  Behavioral proof that `loadRegistry` still throws structured
  `RegistryLoadError` details for ontology validation failures, malformed or
  incorrectly parented classification records, and duplicate id/slug detection
  after the core type split.
* `src/lib/content/registry-runtime-generation.ts`
  Generated runtime source contract for canonical lookup, legacy-id
  canonicalization, parent-child traversal, filtered subtree generation,
  branch-membership authority, deterministic ordering
  (`sortOrder -> slug -> id` for classifications; record-aware ordering for
  members), explicit empty-branch behavior, and
  `listLegacyClassificationBridges`.
* `/browse` Atlas topology navigation (`topology-navigation.ts`, `TopologyBrowsePage`)
  was deleted by `delete-ai-content-infrastructure` story 005. Classification
  subtree helpers remain available via registry runtime for search/related-docs;
  do not reintroduce module-seed browse surfaces.
* `src/lib/search/build-documents.ts`
  Search-term expansion that keeps canonical and legacy classification terms
  discoverable during migration.
* `src/lib/content/ontology-classification-selectors.ts`
  Deleted with Atlas topology browse/timeline selector consumers. Prefer
  registry runtime id/slug resolution for remaining classification lookups.
* `src/lib/content/sidebar-grouping.ts`
  Docs-shell sidebar subgroup resolver. Glossary subgroup placement should
  derive from canonical classification membership first, with remaining
  customer-visible exceptions fenced behind explicit `sidebarGrouping.glossary`
  editorial overrides. Factory Concepts explorer subgroups
  (Harnesses → Industrial engineering → Model inference) resolve from
  `FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG` first, then editorial
  `sidebarGrouping.concepts` for pages outside that map. Program documentation
  explorer placement resolves from `FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG`
  (top group plus optional secondary; FAQ omitted as a top-level explorer page).
  Module, training, and
  system subgroup placement notes below are historical Atlas guidance retained
  for glossary/module compatibility paths.
  Backfill those override entries onto the specific registry records
  that still need manual placement before removing a legacy typed branch. For
  concept/glossary slices,
  migrate the currently grouped published glossary records onto canonical concept
  classifications first, then keep any still-curated glossary families on one named
  editorial fallback helper instead of reintroducing `conceptType` branching.
  For modules, only use the editorial bridge when the canonical classification
  is still too coarse to distinguish the intended subgroup, such as the
  `module.attention` foundation page whose current ontology membership alone
  cannot separate `attention-foundations` from `attention-variants`. Tokenizer
  modules (`classification.module.tokenization`) and positional embedding
  modules (`classification.module.positional-encoding`) should resolve to
  separate sidebar groups (`tokenizers` and `positional-embeddings`) with
  distinct reader-visible labels. Validation should reject redundant or ignored `sidebarGrouping` entries once ontology
  already resolves the same subgroup.
  For concept records that already declare canonical
  `primaryClassificationId`, prefer asserting that ontology classification in
  regression coverage and removing redundant `conceptType` values from the
  record instead of keeping both fields aligned by hand.
* `src/lib/content/tokenizers-split-discovery-validation.test.tsx`
  Cross-cutting regression for the tokenizer versus positional embedding split:
  representative module family membership, CLIP discovery alignment, search and
  related-doc separation, browse topology groups, and browser-visible docs route
  rendering for BPE, RoPE, NoPE, and CLIP image tokenization.
* `src/lib/content/metadata-labels.ts`
  Shared reader-facing metadata label derivation for ontology-backed module,
  training-regime, and system cards. Keep classification-to-label formatting on
  this single helper path instead of reintroducing ad hoc `slug`, `regimeType`,
  or `systemType` display logic inside individual metadata components. If a
  published training-regime or system record still lacks canonical
  classification membership, keep any temporary typed-taxonomy fallback on this
  helper path so the card remains readable without reopening component-level
  legacy field reads, and keep the typed-taxonomy audit/fence contract pointed
  at this helper because it owns the remaining metadata UI compatibility reads.
* `src/features/models/components/ModuleMetadataCard.tsx`
  Module metadata UI. Classification and secondary-classification rows should
  resolve through the shared metadata label helper rather than direct legacy
  typed-taxonomy reads or component-local token formatting.
* `src/features/models/components/TrainingRegimeAtAGlance.tsx`
  Training-regime metadata UI. Regime labels should come from canonical
  classification membership through the shared metadata label helper before any
  temporary compatibility fallback is considered.
* `src/features/models/components/SystemAtAGlance.tsx`
  System metadata UI. System category labels should come from canonical
  classification membership through the shared metadata label helper before any
  temporary compatibility fallback is considered.
* `src/lib/content/topology-selector-compatibility.ts`
  Topology-specific temporary selector fence. Keep any remaining shorthand or
  legacy topology-only aliases here instead of expanding the generic
  ontology-selector helper.
* `src/features/topology/topology-data.ts`
  Selector-to-classification resolution and graph assembly for the customer-
  visible topology surface. Canonical ids/slugs should resolve before any
  temporary compatibility branch, and accepted legacy ids or shorthand
  selectors should stay on one explicit temporary path instead of piggybacking
  on generic runtime lookup.
* `src/features/topology/topology-query.ts`
  Outbound topology URL contract for the graph surface. Keep entry-time
  compatibility support separate from emitted selector URLs so chip toggles,
  clear actions, and other steady-state topology links normalize back to the
  canonical runtime-backed selector set.
* `src/lib/content/topology-navigation.ts`
  Registry-driven browse navigation options that expose classification slugs to
  the browse graph-map entry points. The `/topology` explorer and
  `/docs/timeline` product surfaces were deleted in
  `rewrite-delete-atlas-domain`; do not reintroduce those packages here.
* `src/lib/search/legacy-taxonomy-compat.ts`
  Explicit compatibility adapter for search surfaces that still emit legacy
  typed-taxonomy facets while downstream filters migrate.

## Remaining compatibility fallback outside the proving consumer

* `src/lib/search/build-documents.ts`
  Search still keeps legacy flat classification ids and canonical ids side by
  side for discoverability during migration; this slice does not remove that
  compatibility expansion.
* `src/lib/content/page-spec.ts`
  Page-spec generation and validation still accept legacy taxonomy fields such
  as `conceptType`, `moduleFamily`, and `variantGroup` as temporary
  compatibility inputs outside the migrated `/browse` navigation surface.

## Reviewer-facing verification

* `page-specs/*.json`
  Committed ontology-first starter specs should prefer canonical
  `primaryClassificationId` values; leave legacy ids only in explicitly named
  compatibility fixtures.
* `src/lib/content/generate-page-bundle.test.ts`
  When validating generated canonical bundles in a temporary fixture root, seed
  the required canonical classification parents into that fixture first so the
  generated-bundle validator proves the ontology-first path instead of failing
  on missing local registry context.
* `src/lib/content/generate-page-bundle-cli.test.ts`
  Keep the default CLI fixture root canonical-only for success-path bundle
  generation. If a test needs legacy ids or deprecated taxonomy fields, put
  that setup in an explicitly named compatibility helper or test.
* `src/lib/content/registry-runtime.test.ts`
  Runtime assertions against the committed registry data.
* `src/lib/content/registry-runtime-generation.test.ts`
  Generation-path assertions that new classification bridge behavior survives
  runtime regeneration.
* `src/lib/content/ontology-foundation-regression.test.ts`
  Focused proving-ground regression coverage for the migrated ontology slice.
* `src/lib/content/architecture.ts`
  Architecture browse/index classification should treat ontology architecture
  membership, including descendant branches such as activation, as canonical
  evidence before any legacy `conceptType` fallback.
* `src/lib/governance/typed-taxonomy-consumer-audit.ts`
  Machine-checkable contract for remaining typed-taxonomy consumer clusters,
  ownership, compatibility status, the recommended next migration target, and
  the targeted deprecation fence across runtime, generation, and authoring
  surfaces. When multiple migration slices intentionally share one file, scope
  the entry's field-reference inventory to resolver-specific snippets so the
  audit stays reviewer-visible instead of double-counting the entire file. For
  related-doc work specifically, ontology-first behavior should appear here as
  either a migrated consumer or an explicitly named compatibility-only bridge;
  it should not remain listed as an unresolved primary consumer once direct
  relationships and classification peers define the default reader path. Treat
  shared ancestor secondary classifications as supporting metadata rather than
  exact sibling evidence so child-classification cousins can surface through an
  explicit shared-parent related-doc branch.
* `src/lib/content/related-docs.ts`
  Keep ontology-group normalization and compatibility fallback routing on
  separate helper paths. Legacy peer aliases may expand into ontology groups
  for ontology-backed records, but any remaining `variantGroup` or
  `conceptType` reads should stay reachable only through explicitly named
  compatibility group requests or a no-ontology-data fallback helper.
* `src/lib/governance/legacy-taxonomy-compatibility-budget.ts`
  Shared reviewer-facing budget contract that records the approved baseline for
  one explicit legacy classification-id bridge inventory and one explicit
  deprecated typed-taxonomy compatibility cluster, including the approved
  search-cluster entry inventory and per-entry field-reference budgets used by
  the narrow no-growth guards. The contract is shrink-only: removals stay
  green, while additions, path moves, or field-reference growth fail.
* `src/lib/governance/legacy-taxonomy-compatibility-budget.test.ts`
  Coverage that proves the committed repo still matches the recorded
  compatibility-budget baselines and that budget drift is reported in maintainer
  terms when either governed surface grows, while explicit shrink-path fixtures
  stay aligned.
* `src/tests/ci/legacy-classification-budget-command.test.ts`
  CLI-level proof that the dedicated legacy bridge no-growth verifier stays
  green for the committed runtime bridge inventory and fails red when a fixture
  bridge inventory grows beyond the approved baseline; shrink fixtures should
  remain green.
* `src/lib/governance/typed-taxonomy-consumer-audit.test.ts`
  Regression coverage for grouped audit summaries and contract-drift detection.
* `src/lib/governance/typed-taxonomy-consumer-fence.test.ts`
  Regression coverage proving that new uncategorized or undeclared typed-taxonomy
  usage fails in the targeted surfaces.
* `src/tests/ci/legacy-taxonomy-compatibility-budget-command.test.ts`
  CLI-level proof that maintainers can print the current approved compatibility
  budget for both governed legacy surfaces from the repository root.
* `src/tests/ci/typed-taxonomy-budget-command.test.ts`
  CLI-level proof that the dedicated search typed-taxonomy budget guard stays
  green for the committed approved consumer inventory and field-reference
  counts, remains green for shrink-only reductions, and fails red when an
  approved search-cluster entry grows beyond its recorded field-reference
  budget.
* `src/tests/ci/typed-taxonomy-consumer-audit-command.test.ts`
  CLI-level proof that maintainers can render the current audit summary from the
  repository root. Keep reviewer-facing assertions pinned to the measured
  governance contract, including `Contract status: aligned` and the explicit
  `none: no unresolved migration targets remain in the audit` outcome whenever
  the current slice claims the audit has no unresolved migration target.
* `scripts/report-legacy-taxonomy-compatibility-budget.ts`
  Maintainer entrypoint for printing the approved legacy taxonomy compatibility
  budget and the current measured result for each governed surface.
* `scripts/verify-legacy-classification-budget.ts`
  Maintainer and CI entrypoint that fails when the runtime legacy
  classification bridge inventory grows beyond the approved budget.
* `scripts/verify-typed-taxonomy-budget.ts`
  Maintainer and CI entrypoint that fails when the governed search
  typed-taxonomy compatibility cluster grows beyond the approved per-entry
  budget.
* `src/tests/ci/typed-taxonomy-consumer-fence-command.test.ts`
  CLI-level proof that the targeted deprecation fence stays green for the
  committed compatibility contract, including the reviewer-visible
  `Contract status: aligned` and `Violation status: clear` lines rather than
  only the banner text.
* `scripts/audit-typed-taxonomy-consumers.ts`
  Maintainer entrypoint for printing the typed-taxonomy consumer inventory.
* `scripts/verify-typed-taxonomy-consumer-fence.ts`
  Maintainer and CI entrypoint that fails when new targeted typed-taxonomy
  usage lands outside the approved audit contract.
* Atlas topology browse tests (`topology-browse.test.ts`) were deleted with
  `delete-ai-content-infrastructure` story 005. Do not reintroduce browse
  graph-map assertions for retired Atlas selectors.
* `docs/data-model.md`
  Human-readable ontology contract, runtime ordering rules, empty-branch
  behavior, and temporary bridge rules.
