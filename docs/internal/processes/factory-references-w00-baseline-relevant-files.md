# Factory references W00 baseline — relevant files

Use this file when capturing or refreshing the W00 contract/route baseline under
`docs/temp/references/`.

## Ownership

| Path | Role |
| --- | --- |
| `docs/temp/references/baseline.md` | Human-readable W00 baseline (committed) |
| `docs/temp/references/fixtures/**` | Deterministic inventory fixtures (committed when present) |
| `docs/temp/references/plan.md` | Planner PRD/plan (gitignored scratch; do not commit) |
| `node_modules/@you-agent-factory/api/package.json` | Installed API package identity source |
| `node_modules/@you-agent-factory/components/package.json` | Installed components package identity source |

## Gitignore carve-out

Planner scratch under `docs/temp/` stays ignored. The published W00 baseline is
an exception:

- ignore `docs/temp/*`
- un-ignore `docs/temp/references/`
- re-ignore `docs/temp/references/*`
- un-ignore `baseline.md` and `fixtures/**`

Do not force-add other `docs/temp/` paths. Do not treat recorded inventory
counts in later fixtures as permanent product limits.

## Package identity read path

`@you-agent-factory/api` does not export `./package.json`. Read version/peers
from the installed package root on disk after `bun install`, not via a public
subpath import. Consume contract artifacts only through public subpaths
(`@you-agent-factory/api/manifest`, `.../openapi`, `.../schemas/*`, etc.).

## Manifest export inventory

Read `@you-agent-factory/api/manifest` (resolves to
`generated/manifest.json`). Record every key under `exports` with:

- `family`, `path`, `artifactHash`
- documentation: `formatVersion`, `visibility`, `sourceHash` (plus title /
  description when useful)
- lifecycle: `state`, `since`, `formatVersion`, `itemId`

Also record manifest root `packageId`, `packageVersion`, `formatVersion`,
`sourceCommit`, and `familyFormatVersions`. Export count must match the
installed artifact membership (currently 10); do not copy plan prose if the
package differs. With `packageVersion` `0.0.0`, prefer format versions and
hashes over semver for freshness.

## OpenAPI inventory

Read `@you-agent-factory/api/openapi` (resolves to
`generated/openapi/openapi.yaml`). Parse the YAML and record:

- OpenAPI version (`openapi` root field) and `info.title` / `info.version`
- Path count: `Object.keys(paths).length`
- Operation count: HTTP method entries on each path item (`get`/`put`/`post`/
  `delete`/`options`/`head`/`patch`/`trace`)
- Tag count: document-level `tags` array length (and names when useful)
- Component schema count: `components.schemas` keys
- Shared parameter count: `components.parameters` keys
- Shared response count: `components.responses` keys

Derive counts from the installed artifact. Do not copy plan prose when the
package differs. Counts are baseline drift observations, not permanent product
limits.

## Configuration schema inventory

Read the three public schema subpaths:

- `@you-agent-factory/api/schemas/factory` → `generated/schemas/factory.schema.json`
- `@you-agent-factory/api/schemas/you-config` → `generated/schemas/you-config.schema.json`
- `@you-agent-factory/api/schemas/mock-workers` → `generated/schemas/mock-workers.schema.json`

For each schema record:

- `$id`, `$schema` (Draft 2020-12 on this install), and title when useful
- Root-property count: `Object.keys(schema.properties).length`
- `$defs` count: `Object.keys(schema.$defs).length`
- Root property key names (for reviewer verification)

Derive counts from the installed Draft JSON Schema artifacts. Do not copy plan
prose when the package differs. Current install: factory 18/91, you-config 3/6,
mock-workers 2/5. Counts are baseline drift observations, not permanent product
limits.

## Worker / Workstation discriminator inventory

From `@you-agent-factory/api/schemas/factory`:

- Worker types: `$defs.WorkerType.enum` via `Worker.type` (currently 6:
  `INFERENCE_WORKER`, `AGENT_WORKER`, `SCRIPT_WORKER`, `POLLER_WORKER`,
  `MODEL_WORKER`, `HOSTED_WORKER`)
- Workstation types: `$defs.WorkstationType.enum` via `Workstation.type`
  (currently 8: `INFERENCE_RUN`, `AGENT_RUN`, `SCRIPT_RUN`, `POLLER_RUN`,
  `MODEL_WORKSTATION`, `MODEL_INVOKE`, `LOGICAL_MOVE`, `CLASSIFIER_WORKSTATION`)
- Workstation behaviors: `$defs.WorkstationKind.enum` via
  `Workstation.behavior` (currently 4: `STANDARD`, `REPEATER`, `CRON`,
  `POLLER`)

`Worker` and `Workstation` are broad objects (`type: object`, no `oneOf`);
variant applicability often lives in descriptions. Mock workers are a separate
schema (`schemas/mock-workers`), not a `WorkerType` value. `type` and
`behavior` on Workstation are independent axes (`POLLER_RUN` ≠ `POLLER`).

## SSE stream contract inventory

From `@you-agent-factory/api/openapi`, record the three Runtime SSE operations:

| Path | Role | `x-event-schema` |
| --- | --- | --- |
| `GET /events` | Compatibility-only (never preferred/canonical) | `FactoryEvent` |
| `GET /factory-sessions/{session_id}/events` | Canonical (+ dual Accept JSON recovery) | `FactoryEvent` |
| `GET /factory-sessions/{session_id}/response-events` | Ephemeral | `FactoryResponseEvent` |

OpenAPI 3.0.3 declares `text/event-stream` as a string schema; resolve the real
payload root from `x-event-schema` on that media type. Do not flatten SSE into
a plain string response in docs or projectors.

For each stream record role, envelope, discriminator/payload inventory,
reconnect/cursor rules, headers, and keepalive/stale/stream-generation
semantics from operation prose + component schemas. Key schemas:

- `FactoryEvent` — envelope + `type` discriminator mapping (**31** payloads)
- `FactoryResponseEvent` — ephemeral envelope; `kind` (**12**), `phase` (**6**),
  `FactoryResponseEventPayload` `oneOf` (**14**); select payload via kind+phase
  + structural decoding (no envelope-level discriminator mapping)
- Canonical-only: identity handshake headers
  `X-Factory-Session-{Backend-Scope,Logical-Session-Key,Factory-Session,Stream-Generation}-Id`;
  JSON probe `FactorySessionEventStreamRecovery` (`outcome` /
  `STREAM_READY`|`CURSOR_STALE`|`UNKNOWN_SESSION`|`INTERNAL_ERROR`)
- Cursor precedence on canonical stream: `after_event_id` wins over
  `after_sequence`; sequence prefers `context.sessionSequence` then
  `context.sequence`
