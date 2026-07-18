# W00 contract inventory fixtures

Machine-readable snapshots of the installed `@you-agent-factory/api` contract
inventories for the W00 baseline lane. Pair with
[`../baseline.md`](../baseline.md) for the human-readable findings.

## Observation policy

**Counts and membership lists are baseline observations for drift detection.**
They are **not** permanent product limits, hard ceilings, or UI quotas. Later
lanes should treat fixture diffs as “the installed package changed” signals,
not as authority to freeze inventory sizes in product UI.

## Files

| Fixture | Covers (stories) |
| --- | --- |
| `manifest-inventory.json` | Manifest exports, hashes, lifecycle (002) |
| `openapi-inventory.json` | Paths, operations, tags, schemas, parameters, responses (003) |
| `schema-inventory.json` | factory / you-config / mock-workers root + `$defs` (004) |
| `variant-inventory.json` | Worker types, Workstation types, behaviors (005) |
| `sse-inventory.json` | Three SSE streams + event discriminators (006) |

Each fixture includes `baselineObservationNote` repeating the observation
policy above, plus identity lists and numeric `counts` so diffs show *what*
changed, not only that a count moved.

## Regenerating

Derive fixtures from the currently installed package (deterministic for the
same install):

```bash
bun ./scripts/regenerate-w00-reference-baseline-fixtures.ts
```

The script derives inventories from the installed package, writes JSON, then runs
Biome formatting so the fixtures stay lint-clean. Do not hand-edit membership
lists or counts. Re-run after upgrading `@you-agent-factory/api`, then review
the fixture diff alongside `baseline.md`.

## Drift tests

Focused tests recompute inventories via
`src/lib/references/w00-baseline-inventory.ts` and compare to the committed
JSON files:

```bash
bun test src/lib/references/w00-baseline-inventory.test.ts
```

A mismatch is package/fixture drift — regenerate, then update `baseline.md`.
Do not treat count failures as authority to freeze inventory sizes in UI.

## Ownership

W00 owns these fixtures and focused drift tests only. No package resolver,
renderers, route families, or production UI.
