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
- Later stories own field-semantics resolution, companion matrices, and
  package-backed field/discriminator validation.

## Verification

```bash
bun test src/lib/references/overlays/
bunx biome check src/lib/references/overlays/
bun run typecheck
bun run lint
```
