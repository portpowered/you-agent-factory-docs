# Variant Overlay Contract (W06) Relevant Files

Use these files when implementing or extending the W06 Worker/Workstation
variant overlay contract and validator on top of the merged W04 normalized
reference model.

## Ownership fence

W06 owns only overlay contract / validator modules, fixtures, and tests under
`src/lib/references/overlays/` (or equivalent non-UI surface). Do **not**:

- build SchemaReference / SchemaFieldTree UI (W07)
- build specialized API / event / CLI renderers (W08–W10)
- author Worker / Workstation pages (W13 / W14)
- copy canonical field prose (descriptions, types, defaults, enums, constraints)
  into overlays
- patch `node_modules` or import `@you-agent-factory/api` package root /
  package-internal paths
- reopen or redefine W04 model types — consume `SchemaAddress` /
  `SchemaDefinitionModel` / `SchemaFieldModel` only

## Key host files

| Path | Role |
| --- | --- |
| `src/lib/references/overlays/factory-variant-overlay-schema.ts` | Pure serializable `FactoryVariantOverlaySchema` + field applicability / companion / example / optional `upstreamDefinition` slots + JSON parse/serialize helpers (no IO) |
| `src/lib/references/overlays/factory-variant-overlay-schema.test.ts` | Contract coverage: required slots, examples-vs-fields separation, no copied prose, W04 address consumption, JSON round-trip |
| `src/lib/references/overlays/factory-variant-overlay-registry.ts` | Pure `FactoryVariantOverlayRegistry` + overlay ID helpers + enum-inventory projection from W04 models / Factory schema data + completeness assert (no IO) |
| `src/lib/references/overlays/factory-variant-overlay-registry.test.ts` | Registry completeness against installed Factory enums via W03 `resolveApiPackageArtifact("schemas/factory")`; missing/unknown fail closed; mock-workers excluded |
| `src/lib/references/overlays/factory-variant-field-semantics.ts` | Typed shared/selected/excluded/conditional meanings + `resolveFactoryVariantApplicableFields` against W04 `SchemaDefinitionModel` (no IO; never invents absent fields) |
| `src/lib/references/overlays/factory-variant-field-semantics.test.ts` | Applicability resolution: excluded omission, conditional `conditionId` gates, no invented base fields |
| `src/lib/references/overlays/factory-variant-compatibility-matrix.ts` | Pure `FactoryVariantCompatibilityMatrix` + companion validation against the overlay registry (no IO); minimal authored Worker ↔ Workstation ↔ behavior facts |
| `src/lib/references/overlays/factory-variant-compatibility-matrix.test.ts` | Missing required / unknown compatible companions fail closed with overlay + companion diagnostics; minimal matrix validates against installed registry |
| `src/lib/references/overlays/factory-variant-overlay-validator.ts` | Pure `FactoryVariantOverlayValidator` — field paths + discriminators against W04 models; prefers `upstreamDefinition` when present; example-ref existence catalog; optional field-attribution incompatible selection; Factory schema → W04 projection helper (no IO) |
| `src/lib/references/overlays/factory-variant-overlay-validator.test.ts` | Missing base, unknown discriminator field/value, absent field paths, missing example refs, incompatible field selection, upstream prefer/contradict/unresolved fail closed; installed package via W03 + W04 projection |
| `src/lib/references/overlays/factory-variant-incompatible-field-selection.ts` | Pure field attribution from overlay `selected` slots + incompatible companion field-selection check (no IO) |
| `src/lib/references/overlays/factory-variant-incompatible-field-selection.test.ts` | Incompatible selection fails with overlay/field/conflicting-variant diagnostics; compatible joint selection does not fail |
| `src/lib/references/overlays/factory-variant-upstream-migration.ts` | Pure upstream migration helpers — prefer resolved `upstreamDefinition`, fail closed on unresolved targets / contradictions, applicability preferring upstream (no IO) |
| `src/lib/references/overlays/factory-variant-upstream-migration.test.ts` | Upstream preference, base fallback, unresolved target, field/discriminator/exclusion contradictions |
| `src/lib/references/overlays/fixtures/incompatible-field-selection.ts` | Focused overlay fixtures for incompatible vs jointly-allowed field selection |
| `src/lib/references/overlays/fixtures/upstream-migration.ts` | Focused overlay + W04 definition fixtures for upstream preference / contradiction / unresolved target |
| `src/lib/references/overlays/fixtures/package-drift.ts` | Focused post-drift definition + overlay fixtures: removed fields, renamed enums, missing refs, incompatible examples |
| `src/lib/references/overlays/fixtures/package-drift.test.ts` | Drift-class fail-closed diagnostics + minimal valid overlay success (fixture catalog + installed W03 package) |
| `src/lib/references/overlays/production-worker-overlays.ts` | W13 production Worker overlays for all six Factory `WorkerType` values (applicability + companions + example refs; mock workers excluded) |
| `src/lib/references/overlays/production-worker-overlays.test.ts` | Production overlays validate via W06 against installed Factory schemas; diagnostics name overlay + identity; joint selected-field attribution stays conflict-free |
| `src/lib/references/schema-model.ts` | W04 `SchemaAddress` / definition / field models consumed by overlays |
| `src/lib/references/api-package-artifact-resolver.ts` | W03 public-subpath acquisition — load Factory schemas only through this surface |

## Patterns

- Keep overlay types pure and IO-free (same rule as W04 identity types).
- Field slots (`shared` / `selected` / `excluded` / `conditional`) list **paths
  or condition identities only**. Reject forbidden prose keys
  (`description`, `type`, `typeSummary`, `default`, `enum`, `const`,
  `format`, `constraints`, `required`, `nullable`) at parse time.
- Authored `examples` are a top-level array of `{ exampleId }` refs — never
  nested under `fields`.
- Base and optional `upstreamDefinition` use W04 `SchemaAddress`
  (`{ publicArtifactId, pointer }`). Do not invent an overlay-local address
  vocabulary.
- Prove JSON serializability with `serializeFactoryVariantOverlay` /
  `deserializeFactoryVariantOverlay` round-trips; overlays must be plain
  objects, not class instances.
- Overlay IDs use `{axis}:{enumValue}` (`worker:…`, `workstation:…`,
  `behavior:…`). Discriminator fields are `type` for worker/workstation and
  `behavior` for WorkstationKind. Completeness compares registry IDs to
  installed `$defs.WorkerType` / `WorkstationType` / `WorkstationKind` enums
  projected through W04 `SchemaDefinitionModel`; acquire the artifact with
  W03 `resolveApiPackageArtifact("schemas/factory")` at the call site.
- Do **not** register mock-worker run types (`accept` / `script` / `reject`)
  as Factory `WorkerType` overlays — they live on `schemas/mock-workers`.
- Resolve applicable fields with `resolveFactoryVariantApplicableFields`
  (or path-only helper). `excluded` always wins; `conditional` requires an
  active `conditionId` (default: none active). Never invent
  `SchemaFieldModel` entries for paths absent from the base — fail closed by
  default, or omit when `failOnUnknownBaseFields: false`.
- Companion facts live in `FactoryVariantCompatibilityMatrix` (overlay ID →
  compatible/required companion overlay IDs). Validate with
  `validateFactoryVariantCompanionRefs` /
  `validateFactoryVariantCompatibilityMatrix`: unknown compatible IDs and
  required IDs absent from the registry fail closed; required implies
  compatible. Minimal authored facts may deepen later without changing the
  contract shape. Apply facts onto overlays with
  `applyFactoryVariantCompatibilityFactToOverlay` when needed.
- Validate overlays with `validateFactoryVariantOverlay` against a
  `FactoryVariantOverlayValidationContext` (W04 definition catalog +
  `knownExampleIds` + optional `fieldAttribution`). Project installed Factory
  schema data with `factoryVariantOverlayDefinitionsFromFactorySchemaData` /
  `createFactoryVariantOverlayValidationContextFromFactorySchemaData` after
  W03 `resolveApiPackageArtifact("schemas/factory")`. Discriminator enums
  resolve via field `enum` or `refTarget` → enum `$defs`. Diagnostics name
  the overlay and offending identity (base address, field path, example ID,
  conflicting variant ID).
- Detect incompatible field selection with
  `buildFactoryVariantFieldAttribution` (from overlay `selected` slots) +
  `validateFactoryVariantIncompatibleFieldSelection`. A selected path
  attributed only to foreign overlays absent from `companions.compatible`
  fails closed. Compatible companions that jointly list a field do not fail
  solely for that overlap. Pass attribution on the validation context or call
  the dedicated helpers / fixture under `overlays/fixtures/`.
- Prefer optional `upstreamDefinition` with
  `resolveFactoryVariantAuthoritativeDefinition` /
  `assertFactoryVariantUpstreamConsistency` /
  `resolveFactoryVariantApplicableFieldsPreferringUpstream`. When upstream
  resolves, it is the authoritative field/discriminator source; unresolved
  targets fail as `missing-upstream-definition` (no silent base fallback);
  contradictory selected/shared/excluded/conditional paths or discriminators
  fail as `upstream-contradiction`. When upstream is absent, validation
  continues against the broad `baseDefinition` as before. Fixtures live under
  `overlays/fixtures/upstream-migration.ts`.
- Package-drift fixtures under `overlays/fixtures/package-drift.ts` prove
  fail-closed diagnostics for removed fields (`unknown-field-path`), renamed
  discriminator enums (`unknown-discriminator-value`), missing base refs
  (`missing-base-definition`), and incompatible example refs
  (`missing-example-ref`), plus success for a minimal valid overlay set.
  Focused tests also re-exercise incompatible companion field selection via
  the story 006 fixtures against installed W03 package models.
- Production Worker overlays (W13) live in
  `overlays/production-worker-overlays.ts`. Put cross-variant applicable
  fields in `shared` and exclusive fields in `selected` so joint
  `validateFactoryVariantOverlaysIncompatibleFieldSelection` stays green.
  Legacy `MODEL_WORKER` / `HOSTED_WORKER` list overlapping capability fields
  as `shared` (not `selected`) to avoid attribution conflicts with
  `INFERENCE_WORKER` / `POLLER_WORKER`. Apply companions via
  `applyFactoryVariantCompatibilityFactToOverlay` +
  `createMinimalFactoryVariantCompatibilityMatrix`. Do not register
  mock-worker run types as Factory Worker overlays.

## Verification

```bash
bun test src/lib/references/overlays/
bunx biome check src/lib/references/overlays/
bun run typecheck
bun run lint
```
