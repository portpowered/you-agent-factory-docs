# W00 Contract and route baseline

Working set: `docs/temp/references/`  
Lane ownership: baseline artifacts and focused fixture tests only. This lane does
**not** implement the package resolver, renderers, route families, or production
UI.

Sources for package identity are the installed packages under `node_modules`
(package resolution), not invented values. Re-check these fields after any
`@you-agent-factory/api` or `@you-agent-factory/components` install change.

## Package versions and peer constraints

Recorded from the installed package roots:

| Package | Installed version | Source |
| --- | --- | --- |
| `@you-agent-factory/api` | `0.0.0` | `node_modules/@you-agent-factory/api/package.json` → `version` |
| `@you-agent-factory/components` | `0.0.0` | `node_modules/@you-agent-factory/components/package.json` → `version` |

Site `package.json` pins both dependencies at `0.0.0`, matching the installed
identity above.

### `@you-agent-factory/api` peers and engines

- `peerDependencies`: **absent** (no peers published on the installed package).
- `peerDependenciesMeta`: **absent**.
- `engines`: **absent**.
- `dependencies`: **absent** (data-only contract package; consume via public
  subpath exports such as `@you-agent-factory/api/manifest`).

Note: the package `exports` map does not expose `./package.json`. Version and
peer fields are read from the installed package root on disk after resolution,
not via a public subpath import.

### `@you-agent-factory/components` peers and engines

- `peerDependencies`:
  - `react`: `^19.0.0`
  - `react-dom`: `^19.0.0`
- `peerDependenciesMeta`: **absent**.
- `engines`: **absent**.

These React peers are the relevant peer constraints for the components package
at the installed `0.0.0` identity.

### Freshness note

Both packages currently publish version `0.0.0`. Later baseline sections treat
manifest `formatVersion` values and artifact hashes as more useful freshness
signals than semver alone.

## Manifest exports

Source: installed `@you-agent-factory/api/manifest`
(`node_modules/@you-agent-factory/api/generated/manifest.json`), not plan prose.

### Manifest root

| Field | Value |
| --- | --- |
| `packageId` | `you-agent-factory.api` |
| `packageVersion` | `0.0.0` |
| `formatVersion` | `1.0.0` |
| `sourceCommit` | `280e13dbb101809532034fef24c6b46144f7f7cc` |
| Export count | **10** (matches installed membership; plan text also expects 10) |

`familyFormatVersions` on the installed manifest:

| Family | Format version |
| --- | --- |
| `cli` | `1.0.0` |
| `config` | `1.0.0` |
| `javascript` | `1.0.0` |
| `mcp` | `1.0.0` |
| `openapi` | `1.0.0` |
| `shared` | `1.0.0` |

Because `packageVersion` is `0.0.0`, treat each export’s documentation
`formatVersion`, lifecycle `formatVersion`, and `artifactHash` /
documentation `sourceHash` as the practical freshness signals rather than
semver alone.

### Export inventory

Each row is one key under `manifest.exports`. Lifecycle is published as
`state` / `since` / `formatVersion` / `itemId`. Documentation metadata below
records `formatVersion`, `visibility`, and `sourceHash` as published on each
export’s `documentation` object.

| Export id | Family | Path | Artifact hash | Doc format | Visibility | Doc source hash | Lifecycle state | Since | Lifecycle format |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `generated.cli.commands` | `cli` | `generated/cli/commands.json` | `6b32edebf7ea06619c958a4723cb96eb5f7c10aa2fcc112c273bf3f809c6424c` | `1.0.0` | `public` | `6b32edebf7ea06619c958a4723cb96eb5f7c10aa2fcc112c273bf3f809c6424c` | `active` | `0.0.0` | `1.0.0` |
| `generated.javascript.runtime-api` | `javascript` | `generated/javascript/runtime-api.json` | `4d1c70325407b340fdd6e072cf9f2f8c77c499001b1553a06691418e6e988247` | `1.0.0` | `public` | `4d1c70325407b340fdd6e072cf9f2f8c77c499001b1553a06691418e6e988247` | `active` | `0.0.0` | `1.0.0` |
| `generated.joined.contracts.common.deprecations` | `shared` | `generated/joined/contracts/common/deprecations.schema.json` | `7ce45d618efb3116525acf3acf08766a550d77bd12f4e525e0f1789dc38e17d8` | `1.0.0` | `public` | `7ce45d618efb3116525acf3acf08766a550d77bd12f4e525e0f1789dc38e17d8` | `active` | `0.0.0` | `1.0.0` |
| `generated.joined.contracts.common.documentation` | `shared` | `generated/joined/contracts/common/documentation.schema.json` | `8126c0a29e39b53733165db4177d486a109cb2b263839d0bd9e6f359cffa4e60` | `1.0.0` | `public` | `8126c0a29e39b53733165db4177d486a109cb2b263839d0bd9e6f359cffa4e60` | `active` | `0.0.0` | `1.0.0` |
| `generated.joined.contracts.manifest` | `shared` | `generated/joined/contracts/manifest.schema.json` | `4dae080e46652c697025016b97d82a03437cdf27f3f0c43f1485812fa271a339` | `1.0.0` | `public` | `4dae080e46652c697025016b97d82a03437cdf27f3f0c43f1485812fa271a339` | `active` | `0.0.0` | `1.0.0` |
| `generated.mcp.tools` | `mcp` | `generated/mcp/tools.json` | `98eff642b8b6bf442de1e150e13bdb89a6beab05c1fec3a24aa270690e9ffb33` | `1.0.0` | `public` | `98eff642b8b6bf442de1e150e13bdb89a6beab05c1fec3a24aa270690e9ffb33` | `active` | `0.0.0` | `1.0.0` |
| `generated.openapi.openapi` | `openapi` | `generated/openapi/openapi.yaml` | `74932a7018dd449663cb9f858be203d4ec3d8de9d3b44f18e944259db0eec568` | `1.0.0` | `public` | `74932a7018dd449663cb9f858be203d4ec3d8de9d3b44f18e944259db0eec568` | `active` | `0.0.0` | `1.0.0` |
| `generated.schemas.factory` | `config` | `generated/schemas/factory.schema.json` | `06ddc805d0901db1f98fcffaab366655ed5764074a1f27a6b16ace51022a2a93` | `1.0.0` | `public` | `06ddc805d0901db1f98fcffaab366655ed5764074a1f27a6b16ace51022a2a93` | `active` | `0.0.0` | `1.0.0` |
| `generated.schemas.mock-workers` | `config` | `generated/schemas/mock-workers.schema.json` | `1aad74057b85a8c0d5c195e945832b373a0d37bbc7fc7efece5aa88085efd7d3` | `1.0.0` | `public` | `1aad74057b85a8c0d5c195e945832b373a0d37bbc7fc7efece5aa88085efd7d3` | `active` | `0.0.0` | `1.0.0` |
| `generated.schemas.you-config` | `config` | `generated/schemas/you-config.schema.json` | `d13af3b56397d8da27f47f7b7823a570583f8ac9207602df04364123bdcf88e1` | `1.0.0` | `public` | `d13af3b56397d8da27f47f7b7823a570583f8ac9207602df04364123bdcf88e1` | `active` | `0.0.0` | `1.0.0` |

Published documentation titles (canonical English) follow the pattern
`Published <export-id> contract`; descriptions follow
`Published <export-id> contract as raw JSON or YAML data.` Lifecycle `itemId`
matches the export id for every row above. On this install, each export’s
`artifactHash` equals its documentation `sourceHash`.

These counts and hashes are baseline observations for later drift detection,
not permanent product limits.

## OpenAPI inventory

Source: installed `@you-agent-factory/api/openapi`
(`node_modules/@you-agent-factory/api/generated/openapi/openapi.yaml`), parsed
from the published YAML artifact—not copied from plan prose.

### Document identity

| Field | Value |
| --- | --- |
| OpenAPI version | `3.0.3` (`openapi` root field) |
| `info.title` | `Agent Factory API` |
| `info.version` | `0.1.0` |
| Manifest export | `generated.openapi.openapi` (see Manifest exports) |

### Inventory counts

Counts are derived by walking the installed document:

- **Paths:** number of keys under `paths`
- **Operations:** HTTP method entries under each path item (`get` / `put` /
  `post` / `delete` / `options` / `head` / `patch` / `trace`)
- **Tags:** entries in the document-level `tags` array
- **Component schemas:** keys under `components.schemas`
- **Shared parameters:** keys under `components.parameters`
- **Shared responses:** keys under `components.responses`

| Inventory | Count |
| --- | --- |
| Paths | **41** |
| Operations | **45** |
| Tags | **6** |
| Component schemas | **405** |
| Shared parameters | **24** |
| Shared responses | **14** |

Document-level tag names (order as published): `Work`, `Factory`, `Runtime`,
`Provider Sessions`, `Models`, `Workflows`.

These counts match the installed artifact on this checkout (plan prose currently
states the same path/operation/schema/parameter/response numbers). They are
baseline observations for later drift detection, not permanent product limits or
UI quotas.

## Configuration schema inventory

Sources: installed Draft 2020-12 JSON Schema artifacts via public subpaths
`@you-agent-factory/api/schemas/factory`,
`@you-agent-factory/api/schemas/you-config`, and
`@you-agent-factory/api/schemas/mock-workers` (files under
`node_modules/@you-agent-factory/api/generated/schemas/`). Counts are derived
from each schema’s root `properties` and `$defs` maps—not copied from plan
prose.

### Counting rules

- **Root-property count:** `Object.keys(schema.properties).length`
- **`$defs` count:** `Object.keys(schema.$defs).length`

### Inventory

| Schema subpath | `$id` | Root properties | `$defs` |
| --- | --- | --- | --- |
| `@you-agent-factory/api/schemas/factory` | `https://schemas.portpowered.com/you/config/factory.schema.json` | **18** | **91** |
| `@you-agent-factory/api/schemas/you-config` | `https://schemas.portpowered.com/you/config/you-config.schema.json` | **3** | **6** |
| `@you-agent-factory/api/schemas/mock-workers` | `https://schemas.portpowered.com/you/config/mock-workers.schema.json` | **2** | **5** |

All three publish `$schema` `https://json-schema.org/draft/2020-12/schema` and
root `type` `object`. Titles as published: “You Factory configuration”, “You
operator and system configuration”, “You mock-worker configuration”.

### Root property names (as published)

| Schema | Root `properties` keys |
| --- | --- |
| factory | `factoryDirectory`, `guards`, `id`, `inputTypes`, `invocationReturn`, `invocationSignature`, `layout`, `metadata`, `name`, `orchestrator`, `resources`, `runner`, `sourceDirectory`, `supportingFiles`, `version`, `workTypes`, `workers`, `workstations` |
| you-config | `backendScopeID`, `defaults`, `workerPresets` |
| mock-workers | `mockWorkers`, `unmatchedDispatchPolicy` |

These root/`$defs` counts match the installed artifacts on this checkout (plan
prose currently states the same numbers). They are baseline observations for
later drift detection, not permanent product limits or UI quotas.

## Worker types, Workstation types, and behaviors

Source: installed `@you-agent-factory/api/schemas/factory`
(`generated/schemas/factory.schema.json`). Discriminator values come from
`$defs.WorkerType`, `$defs.WorkstationType`, and `$defs.WorkstationKind` as
referenced by `Worker.type`, `Workstation.type`, and `Workstation.behavior`.
Values are derived from the installed schema enums—not copied from plan prose.

### Shape limitation (explicit)

`$defs.Worker` and `$defs.Workstation` are **broad `type: object` definitions**
with `additionalProperties: false`. They are **not** upstream `oneOf`
discriminated variant `$defs`. Variant applicability (for example “used only by
`CLASSIFIER_WORKSTATION`” or “Explicit agent-loop tool policy for
`AGENT_WORKER`”) lives primarily in property **descriptions**, not in
machine-enforced per-variant subschemas. Later authored pages and overlays must
not assume a schema `oneOf` tree exists for these families.

On this install, the only top-level `$defs` entry with `oneOf` is
`WorkContentPart` (unrelated to Worker/Workstation discrimination).

### Worker types (`$defs.WorkerType` → `Worker.type`)

Six published values (order as in the installed enum):

| Enum value | Plan page slug alignment |
| --- | --- |
| `INFERENCE_WORKER` | `/docs/workers/inference` |
| `AGENT_WORKER` | `/docs/workers/agent` |
| `SCRIPT_WORKER` | `/docs/workers/script` |
| `POLLER_WORKER` | `/docs/workers/poller` |
| `MODEL_WORKER` | `/docs/workers/model` |
| `HOSTED_WORKER` | `/docs/workers/hosted` |

`Worker` required property: `name` only. `type` is optional in the schema but
selects the implementation family when present.

### Mock-worker family (separate schema)

Mock workers are **not** a `WorkerType` enum member. They live in
`@you-agent-factory/api/schemas/mock-workers` (`$defs.mockWorker`) with
`runType` ∈ `accept` | `script` | `reject`. Plan alignment treats them as a
separate authored surface (`/docs/workers/mock`), not as a seventh Factory
`WorkerType`. Do not merge mock-worker inventory into `WorkerType` counts.

### Workstation types (`$defs.WorkstationType` → `Workstation.type`)

Eight published values (order as in the installed enum):

| Enum value | Plan page slug alignment |
| --- | --- |
| `INFERENCE_RUN` | `/docs/workstations/inference-run` |
| `AGENT_RUN` | `/docs/workstations/agent-run` |
| `SCRIPT_RUN` | `/docs/workstations/script-run` |
| `POLLER_RUN` | `/docs/workstations/poller-run` |
| `MODEL_WORKSTATION` | `/docs/workstations/model-workstation` |
| `MODEL_INVOKE` | `/docs/workstations/model-invoke` |
| `LOGICAL_MOVE` | `/docs/workstations/logical-move` |
| `CLASSIFIER_WORKSTATION` | `/docs/workstations/classifier` |

### Workstation behaviors (`$defs.WorkstationKind` → `Workstation.behavior`)

Four published scheduling behaviors (order as in the installed enum). The field
on `Workstation` is named `behavior`; the enum `$def` is named
`WorkstationKind`:

| Enum value | Plan page slug alignment |
| --- | --- |
| `STANDARD` | `/docs/workstations/standard` |
| `REPEATER` | `/docs/workstations/repeater` |
| `CRON` | `/docs/workstations/cron` |
| `POLLER` | `/docs/workstations/poller` |

`type` and `behavior` are **independent axes**: runtime implementation vs
scheduling. In particular, `POLLER_RUN` (type) is distinct from `POLLER`
(behavior).

`Workstation` required properties: `name`, `worker`, `inputs`.

### Inventory summary

| Axis | Schema `$def` | Field | Count |
| --- | --- | --- | --- |
| Worker type | `WorkerType` | `Worker.type` | **6** |
| Workstation type | `WorkstationType` | `Workstation.type` | **8** |
| Workstation behavior | `WorkstationKind` | `Workstation.behavior` | **4** |

These discriminator inventories match the installed Factory schema on this
checkout (plan prose currently lists the same membership). They are baseline
observations for later drift detection, not permanent product limits or UI
quotas.

## SSE stream contracts

Source: installed `@you-agent-factory/api/openapi`
(`generated/openapi/openapi.yaml`). All three operations are under the Runtime
tag. OpenAPI 3.0.3 represents each stream `200` body as `text/event-stream`
with a **string** schema; the real JSON payload root is carried by the
project-specific `x-event-schema` extension. Later lanes must not flatten these
into a generic “string response.”

### Presentation roles (explicit)

| Operation | Role | Preferred / canonical? |
| --- | --- | --- |
| `GET /events` | **Compatibility-only** process-global stream | **Never** preferred or canonical |
| `GET /factory-sessions/{session_id}/events` | **Canonical** session-scoped FactoryEvent stream (+ JSON reconnect probe) | Yes — default for dashboard / durable replay |
| `GET /factory-sessions/{session_id}/response-events` | **Ephemeral** FactoryResponseEvent observation stream | Ephemeral only; never presents as canonical replay state |

### Stream inventory

| Path | `operationId` | Summary (as published) | `x-event-schema` | Dual `Accept` |
| --- | --- | --- | --- | --- |
| `/events` | `getEvents` | Stream process-global factory events (compatibility-only) | `#/components/schemas/FactoryEvent` | No (SSE only) |
| `/factory-sessions/{session_id}/events` | `getEventsBySessionId` | Stream factory events for one session | `#/components/schemas/FactoryEvent` | Yes: `text/event-stream` **or** `application/json` → `FactorySessionEventStreamRecovery` |
| `/factory-sessions/{session_id}/response-events` | `getFactoryResponseEventsBySessionId` | Stream ephemeral response events for one Factory Session | `#/components/schemas/FactoryResponseEvent` | No (SSE only) |

### Shared OpenAPI limitation

OpenAPI 3.0.3 cannot structurally declare SSE event ids, comment keepalives, or
per-connection ordering. Lifecycle rules below are documented in operation
prose (and this baseline), not as unsupported response fields.

---

### 1. `GET /events` — compatibility-only

- **Role:** Legacy / operator diagnostics process-global stream. Does **not**
  carry session identity handshakes and must **not** govern default-session
  dashboard recovery.
- **Parameters:** `after_event_id`, `after_sequence` (shared
  `AfterEventId` / `AfterSequence` components).
- **Envelope:** each SSE `data` frame is JSON matching `FactoryEvent`.
- **Ordering:** retained history first in ascending tick order, then live
  events on the same connection.
- **Reconnect:** clients may pass `after_event_id` or `after_sequence` for
  events newer than the acknowledged point.
- **Identity headers:** none on this route.
- **JSON recovery probe:** absent.
- **Canonical presentation rule:** never mark this route preferred/canonical;
  new Factory Session and durable replay consumers use the session-scoped
  route instead.

---

### 2. `GET /factory-sessions/{session_id}/events` — canonical

- **Role:** Canonical `FactoryEvent` SSE for dashboard, Factory Session, and
  durable replay traffic scoped to one explicit `session_id`.
- **Doc id:** `agent-factory/api/factory-session-events` (`x-doc-id`).
- **Parameters:** `session_id` (path; `~default` targets the default
  compatibility session explicitly), plus `after_event_id` / `after_sequence`.
- **Envelope:** each SSE `data` frame is JSON matching `FactoryEvent`
  (`x-event-schema`).
- **Ordering:** retained history first in ascending tick order, then live
  `FactoryEvent` records on the same connection.
- **Reconnect cursor precedence:** when both cursors are present,
  **`after_event_id` wins**. For session-scoped streams, `after_sequence`
  prefers `FactoryEvent.context.sessionSequence` when present; otherwise falls
  back to `FactoryEvent.context.sequence`. Omitting both starts replay from the
  beginning of the session’s currently retained history.
- **Replay bounds:** live sessions replay only events retained for the current
  **stream generation** of the targeted Factory Session. Durable execution
  session identifiers replay persisted canonical records for that session
  without crossing into another session. Cursors that no longer match the
  retained-history boundary return typed invalid-cursor handling (**400** on
  SSE open; **`CURSOR_STALE`** on JSON reconnect probe) rather than silently
  skipping events.
- **Identity handshake headers** (compare with sync-preflight / session-read
  before reusing a persisted reconnect cursor or stream-derived cache):
  - `X-Factory-Session-Backend-Scope-Id`
  - `X-Factory-Session-Logical-Session-Key-Id`
  - `X-Factory-Session-Factory-Session-Id`
  - `X-Factory-Session-Stream-Generation-Id`
  A changed `streamGenerationId` invalidates prior cursors even when
  `factorySessionId` is unchanged.
- **Keepalives:** successful SSE responses use Connection keep-alive. Idle
  periods while waiting for new canonical events are normal waiting state, not
  terminal completion, unless the HTTP connection closes.
- **Dual Accept / JSON recovery probe:** when `Accept` includes
  `application/json`, the same route returns
  `FactorySessionEventStreamRecovery` instead of opening SSE:
  - Required fields: `factorySessionId`, `outcome`, `retry`
  - `outcome` ∈ `STREAM_READY` | `CURSOR_STALE` | `UNKNOWN_SESSION` |
    `INTERNAL_ERROR`
  - `retry`: `{ omitAfterEventId, omitAfterSequence }` — `CURSOR_STALE` tells
    clients to retry with both omit flags set so the next open drops stale
    cursors
  - `UNKNOWN_SESSION` means the selector does not resolve to a live or durable
    session and **never** falls back to the default session
- **Unknown session:** returns **404** `NOT_FOUND` (no default-session
  fallback).

---

### 3. `GET /factory-sessions/{session_id}/response-events` — ephemeral

- **Role:** Ephemeral `FactoryResponseEvent` observation records for one
  Factory Session. Outside canonical `FactoryEvent` replay; **must not** derive
  canonical Factory state.
- **Parameters:** `session_id` (path); `after_sequence` (response-event cursor,
  last acknowledged `FactoryResponseEvent.sequence`); optional filters
  `dispatch_id`, repeated `kind` (`FactoryResponseEventKind`).
- **Envelope:** each SSE `data` record is JSON matching `FactoryResponseEvent`;
  each SSE `id` is the decimal `FactoryResponseEvent.sequence`.
- **Ordering:** retained matching records first in ascending response sequence,
  then live matching records.
- **Reconnect:** omit `after_sequence` to start at the beginning of retained
  history. When a cursor predates retained history, the first emitted record is
  **`STREAM_GAP`** describing the lost range (no silent skip).
- **Identity handshake headers / JSON recovery probe:** absent on this route.
- **Error surface (typed):** 400 `ResponseEventBadRequest`, 404
  `ResponseEventSessionNotFound` (never falls back to current/default session),
  410 `ResponseEventStreamExpired`, 500 `InternalError`.

---

### `FactoryEvent` envelope and discriminator

Schema: `#/components/schemas/FactoryEvent`.

| Field | Notes |
| --- | --- |
| `schemaVersion` | enum `agent-factory.event.v1` |
| `id` | Stable event identifier (preserve in record/replay) |
| `type` | Discriminator → `FactoryEventType` |
| `context` | `FactoryEventContext` (required: `sequence`, `tick`, `eventTime`; also `sessionId`, `sessionSequence`, …) |
| `payload` | `oneOf` payload schemas keyed by `type` |

**Discriminator:** `propertyName: type` with **31** mappings (matches
`FactoryEventType` enum length on this install):

| `type` | Payload schema |
| --- | --- |
| `RUN_REQUEST` | `RunRequestEventPayload` |
| `INITIAL_STRUCTURE_REQUEST` | `InitialStructureRequestEventPayload` |
| `FACTORY_CHANGE` | `FactoryChangeEventPayload` |
| `WORK_REQUEST` | `WorkRequestEventPayload` |
| `RELATIONSHIP_CHANGE_REQUEST` | `RelationshipChangeRequestEventPayload` |
| `DISPATCH_REQUEST` | `DispatchRequestEventPayload` |
| `MODEL_REQUEST` | `ModelRequestEventPayload` |
| `MODEL_RESPONSE` | `ModelResponseEventPayload` |
| `INFERENCE_REQUEST` | `InferenceRequestEventPayload` |
| `INFERENCE_RESPONSE` | `InferenceResponseEventPayload` |
| `SCRIPT_REQUEST` | `ScriptRequestEventPayload` |
| `SCRIPT_RESPONSE` | `ScriptResponseEventPayload` |
| `AGENT_RUN_RESPONSE` | `AgentRunResponseEventPayload` |
| `DISPATCH_RESPONSE` | `DispatchResponseEventPayload` |
| `WORK_STATE_CHANGE` | `WorkStateChangeEventPayload` |
| `FACTORY_STATE_RESPONSE` | `FactoryStateResponseEventPayload` |
| `RUN_RESPONSE` | `RunResponseEventPayload` |
| `SESSION_STARTED` | `SessionStartedEventPayload` |
| `SESSION_PAUSED` | `SessionPausedEventPayload` |
| `SESSION_RESUMED` | `SessionResumedEventPayload` |
| `SESSION_RESULT_UPDATED` | `SessionResultUpdatedEventPayload` |
| `SESSION_COMPLETED` | `SessionCompletedEventPayload` |
| `SESSION_LIFECYCLE_CONTROL` | `SessionLifecycleControlEventPayload` |
| `ORCHESTRATOR_PHASE_CHANGED` | `OrchestratorPhaseChangedEventPayload` |
| `ORCHESTRATOR_CHECKPOINT_WRITTEN` | `OrchestratorCheckpointWrittenEventPayload` |
| `DISPATCH_QUEUED` | `DispatchQueuedEventPayload` |
| `DISPATCH_INTERRUPTED` | `DispatchInterruptedEventPayload` |
| `DISPATCH_RECONCILED` | `DispatchReconciledEventPayload` |
| `JAVASCRIPT_CHECKPOINT_REF` | `JavaScriptCheckpointRefEventPayload` |
| `JAVASCRIPT_PHASE_CHANGE` | `JavaScriptPhaseChangeEventPayload` |
| `ARTIFACT_CREATED` | `ArtifactCreatedEventPayload` |

Payload schemas are **payload-only**; projectors must not present them as
complete event envelopes without the shared `FactoryEvent` fields.

---

### `FactoryResponseEvent` envelope and dimensions

Schema: `#/components/schemas/FactoryResponseEvent`. Explicitly ephemeral;
must not derive canonical work state after replay.

**Required envelope fields:** `schemaVersion` (`agent-factory.response-event.v1`),
`eventId`, `sequence`, `recordedAt`, `factorySessionId`, `runId`, `kind`,
`phase`, `provenance`, `payload`. Optional correlation:
`dispatchId`, `turnId`, `itemId`, `parentItemId`, `providerSessionRef`.

**`FactoryResponseEventKind` (12):** `SESSION`, `RUN`, `TURN`, `MESSAGE`,
`REASONING`, `TOOL`, `FILE_CHANGE`, `PLAN`, `PROGRESS`, `USAGE`, `ERROR`,
`STREAM_GAP`.

**`FactoryResponseEventPhase` (6):** `STARTED`, `DELTA`, `UPDATED`,
`COMPLETED`, `FAILED`, `CANCELED`. Allowed kind/phase combinations are
validated before publication.

**`FactoryResponseEventPayload` `oneOf` (14 shapes):**

| Payload schema |
| --- |
| `FactoryResponseEventSessionPayload` |
| `FactoryResponseEventRunPayload` |
| `FactoryResponseEventTurnPayload` |
| `FactoryResponseEventMessagePayload` |
| `FactoryResponseEventMessageDeltaPayload` |
| `FactoryResponseEventReasoningPayload` |
| `FactoryResponseEventToolPayload` |
| `FactoryResponseEventToolDeltaPayload` |
| `FactoryResponseEventFileChangePayload` |
| `FactoryResponseEventPlanPayload` |
| `FactoryResponseEventProgressPayload` |
| `FactoryResponseEventUsagePayload` |
| `FactoryResponseEventErrorPayload` |
| `FactoryResponseEventStreamGapPayload` |

`MESSAGE` and `TOOL` kinds use distinct snapshot vs delta payload shapes;
consumers select the variant using envelope `kind` and `phase` together with
structural decoding (no single OpenAPI discriminator mapping on the envelope).

**Provenance** (`FactoryResponseEventProvenance`): required `provider`,
`nativeEventType`, `delivery`, `representation`, `fidelity` — diagnostic
identity without promoting provider-native schemas into the public vocabulary.

### Inventory summary (baseline observations)

| Signal | Count (this install) |
| --- | --- |
| SSE operations | **3** |
| `FactoryEvent.type` mappings | **31** |
| `FactoryResponseEventKind` | **12** |
| `FactoryResponseEventPhase` | **6** |
| `FactoryResponseEventPayload` `oneOf` | **14** |

These counts match the installed OpenAPI artifact on this checkout (plan prose
currently states the same numbers). They are baseline observations for later
drift detection, not permanent product limits or UI quotas.

## Documentation-route and runtime assumptions

Evidence is from live site code and generated contracts on this checkout, not
plan-only claims. The live factory docs surface for product documentation is
**flat** `/docs/documentation/<slug>` (currently **33** published page bundles
under `src/content/docs/documentation/` with matching
`src/content/registry/documentation/<slug>.json`).

There is **no** live top-level `/docs/references`, `/docs/factories`,
`/docs/workers`, or `/docs/workstations` route family today. Worker and
workstation material ships as sibling flat documentation pages (for example
`/docs/documentation/workers`, `/docs/documentation/agent-workers`,
`/docs/documentation/workstations`).

### Collections and page discovery

Supported canonical docs sections (`DOCS_SECTIONS` /
`DOCS_COLLECTION_DEFINITIONS`):

| Collection id | `routeSlug` | Registry / frontmatter kind |
| --- | --- | --- |
| `guides` | `guides` | `guide` |
| `concepts` | `concepts` | `concept` |
| `techniques` | `techniques` | `technique` |
| `documentation` | `documentation` | `documentation` |
| `glossary` | `glossary` | glossary frontmatter; registry kind `concept` |

Ordinary page bundle layout:

```text
src/content/docs/<section>/<slug>/page.mdx
src/content/docs/<section>/<slug>/messages/<locale>.json
src/content/docs/<section>/<slug>/assets.json
src/content/registry/<section>/<slug>.json
```

Fumadocs scans `src/content/docs/**/*.{md,mdx}` (`source.config.ts`). Page
frontmatter requires `kind`, `registryId`, `messageNamespace`, `assetNamespace`,
`tags`, `status`, and `updatedAt`. Documentation pages use
`kind: "documentation"` and `messageNamespace: "local"`.

`docsSlug` is the path relative to `src/content/docs` (for example
`documentation/workers`). Filesystem walkers can discover nested `page.mdx`
directories, but the local rendering/registry/nav contract assumes **exactly**
`<section>/<slug>` (two segments).

### Registry

- Authoritative per-page JSON: `src/content/registry/documentation/<slug>.json`
  (id pattern `documentation.<slug>`).
- Build-time generator `bun run prepare:content-runtime` emits:
  - `src/lib/content/generated/published-docs-registry.generated.ts` —
    `registryId`, leaf `slug`, `docsSlug`, `url`, `pageKind`, `section`
  - `src/lib/content/generated/registry-runtime.generated.ts` — typed getters
    such as `getDocumentationById`
- Published section inventory (`PUBLISHED_DOCS_SECTIONS`): `glossary`,
  `concepts`, `guides`, `techniques`, `documentation`.
- Leaf `slug` derivation uses the **last** `/`-split segment of `docsSlug`
  (`published-docs-registry-source.ts`). Nested parents would be discarded.
- Canonical href helper
  `documentationPageHref(slug)` → `/docs/documentation/<slug>` (locale-aware
  via `buildLocalizedRoute`).

### Loaders and App Router

| Surface | Path |
| --- | --- |
| Default-locale catch-all | `src/app/docs/[[...slug]]/page.tsx` |
| Localized catch-all | `src/app/[locale]/docs/[[...slug]]/page.tsx` |
| Section index | `src/app/(site)/docs/documentation/page.tsx` and locale twin |

Catch-all rendering goes through `renderDocsSlugPage` → local-message loader
first (`renderLocalDocsPage`), then Fumadocs fallback.

**Critical two-segment contract** (`parseLocalDocsPageRef` in
`local-docs-page.ts`):

- Accepts only `slug.length === 2` with first segment in
  `{guides,concepts,techniques,documentation,glossary}`.
- `isLocalDocsPageBundlePath` likewise requires exactly two path segments
  before `page.mdx`.
- Disk loader `loadDocumentationPageFromDisk(slug)` joins a **single** leaf
  slug under `DOCUMENTATION_DOCS_ROOT`.

Fumadocs `source` (`src/lib/source.ts`) maps `.../page.mdx` paths to slug
arrays via `pageBundleSlug`, accepting only
`isAcceptedDocsSourceSection` first segments. Nested paths could appear in
slug arrays from disk, but local docs pages would fail the length-2 gate and
would not load messages/assets through the supported pipeline.

Static params:

- Default locale: `source.generateParams()` filtered by
  `omitRetiredAtlasDocsStaticParams`, then
  `ensureStaticExportParams` (placeholder when empty under static export).
- Localized: `loadShippedLocalizedDocsPages(locale)` →
  `slug: page.docsSlug.split("/")`.

### Navigation

Explorer order (`FACTORY_EXPLORER_SECTION_ORDER`): Guides → Concepts →
Techniques → Program documentation, plus FAQ as a **top-level** explorer page
(`documentation/faq` is not nested under the Program documentation folder).

Sidebar bucketing uses the **first** `docsSlug` segment only
(`docs-sidebar-sections.ts`). Documentation grouping keys off the leaf slug
after the `documentation/` prefix
(`FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG`). Breadcrumbs expose collection
index + page title only (no intermediate nested crumbs).

### Locales

Supported locales (`supportedLocales`): `en`, `ja`, `zh-CN`, `vi`. Default
`en` uses unprefixed `/docs/...`. Other locales use `/<locale>/docs/...`.

Non-default locales are **opt-in per page**: a page ships for a locale only
when its localized messages file is present
(`isDocsPageShippedForLocale`). Unshipped localized slugs `notFound()`.
Metadata alternates include only shipped locales.

### Search

Orama pipeline (`src/lib/search/`):

1. `loadShippedLocalizedDocsPages(locale)`
2. `buildSearchDocuments` / `buildSearchDocumentsForLocale` (registry enrichment)
3. Orama index (`orama-index.ts`)
4. Static-export bootstrap JSON (`emit-export-search-index.ts`;
   `DOCS_SEARCH_BOOTSTRAP_FROM_ENV` in `next.config.ts`)

Document ids/URLs follow flat published `page.url` values. Retired Atlas URL
prefixes are excluded from search inventories.

### Sitemap

`src/app/sitemap.ts` → `listPublicSitemapRoutes()` (`force-static`):

- Shell routes (`/`, `/search`, `/browse`, `/blog`, `/tags`)
- Docs section indexes from `PUBLISHED_DOCS_SECTIONS` plus `/docs/architecture`
- Article URLs from `listPublishedDocsEntries()` (includes
  `/docs/documentation/<slug>`)
- Blog posts and tag pages
- Filtered through `isLiveFactoryCanonicalPath` (drops retired Atlas /
  deleted paths)

### Static export

When `NEXT_STATIC_EXPORT=1`, Next config merges `output: "export"` and
`images.unoptimized: true` (`static-export.ts`). Constraints that affect route
families:

- Every public docs page must appear in `generateStaticParams`.
- Empty dynamic param lists get placeholders that 404
  (`ensureStaticExportParams`).
- Required factory index page markers include
  `docs/documentation/page.tsx`
  (`SUPPORTED_FACTORY_EXPORT_APP_PAGE_MARKERS`).
- Optional GitHub Pages `basePath` via `GITHUB_PAGES_BASE_PATH`.

Static export implies **no** assumed server-side redirects at runtime; route
compatibility must be static HTML / client-safe patterns (recorded in the
compatibility baseline story).

### Blockers for nested `/docs/references|factories|workers|workstations/...`

Assumptions that would block the planned nested route families until
route-foundation work lands:

1. **Collection inventory** — only five `DOCS_SECTIONS` /
   `DOCS_COLLECTION_DEFINITIONS`; unknown first segments are rejected by
   `isAcceptedDocsSourceSection` / local-page parsing.
2. **Exactly two slug segments** — `parseLocalDocsPageRef`,
   `isLocalDocsPageBundlePath`, documentation disk loader, and
   `documentationPageHref` all assume `<collection>/<leaf-slug>`.
3. **No App Router indexes** for `references` / `factories` / `workers` /
   `workstations`; static-export compile-graph markers only list the five
   current section indexes (+ blog).
4. **Published registry / sitemap / search** derive section from the first
   path segment and leaf slug from the last; nested parents are not modeled.
5. **Sidebar explorer** order and documentation grouping are fixed to the
   current four CLI folders + FAQ exception; no hierarchy for nested leaves.
6. **Live worker/workstation URLs** remain under `/docs/documentation/*`, not
   separate families — treating those prefixes as already live would conflict
   with today’s published registry and sitemap.

Adding the planned families is therefore a coordinated collection, loader,
href, navigation, generator, sitemap, search, and static-export change — not a
content-only addition under the current documentation route contract.

## Compatibility and redirect mechanisms

Evidence is from live site code and export/SEO contracts on this checkout.
**This story records mechanisms only; it does not migrate any
`/docs/documentation/*` routes.**

### Static-export constraint (no server redirects)

When `NEXT_STATIC_EXPORT=1`, Next merges `output: "export"`
(`src/lib/build/static-export.ts` → `staticExportNextConfig`). The live
`next.config.ts` has **no** `redirects()`, `rewrites()`, or headers-based
redirect rules. There is also **no** `public/_redirects`, meta-refresh
compat page, or App Router `redirect()` / `permanentRedirect()` usage under
`src/` for moved docs URLs.

Implication for migration lanes: **do not invent runtime server-side
redirects** for GitHub Pages static export. Old inbound URLs need an explicit
static HTML outcome (compatibility document, client-safe pattern, or another
host-supported static mechanism) plus a new canonical declaration. Silent
removal of a published `/docs/documentation/*` URL is forbidden by the
reference plan; this baseline confirms the site does not yet ship that
compat layer for the planned move set.

### How canonical URLs are declared today

Canonical identity is **Next.js Metadata**, not a redirect table:

| Layer | Mechanism | Notes |
| --- | --- | --- |
| App-relative canonical | `localizedRouteAlternates()` (`src/lib/i18n/route-locale.ts`) | Sets `alternates.canonical` to the default-locale path via `buildLocalizedRoute`; also builds hreflang `languages` |
| Docs pages | `buildDocsPageAlternates` (`src/app/docs/docs-slug-renderer.tsx`) | Same helper; **filters** `languages` with `isDocsPageShippedForLocale` (fail-closed) |
| Absolute production URL | Root `metadataBase` via `resolveProductionMetadataBase` (`src/lib/seo/production-metadata-base.ts`) | Origin `https://portpowered.github.io`; project-site export joins `/you-agent-factory-docs`. Metadata field hrefs stay **app-relative** so Next does not double-prefix |
| Open Graph mirror | `withPageOpenGraph` / `pageOpenGraph` (`src/lib/seo/page-open-graph.ts`) | Mirrors title/description and keeps `openGraph.url` aligned with the canonical path |
| Live-path gate | `isLiveFactoryCanonicalPath` (`src/lib/seo/export-absolute-canonical.ts`) | Rejects retired Atlas URL prefixes, `/topology`, `/docs/timeline`, and deleted Atlas blog slugs for sitemap/canonical proofs |

A page’s public canonical is therefore “whatever path that page’s
`generateMetadata` advertises,” joined onto production `metadataBase`. There
is **no** separate ledger that maps an old docs path to a new canonical while
still serving HTML at the old path.

### Proven static patterns (retirement / exclusion — not redirects)

The project’s proven handling for **retired** Atlas product surfaces is
**omit + not-found + discovery exclusion**, not HTTP redirects:

1. **Do not emit static HTML** for retired docs collections —
   `omitRetiredAtlasDocsStaticParams` /
   `isRetiredAtlasDocsSlug`
   (`src/lib/build/static-export-legacy-compile-graph.ts`) filter
   `generateStaticParams` so `/docs/{models,modules,papers,training,systems}/…`
   never schedule export work.
2. **Runtime missing routes** — catch-all docs rendering calls `notFound()`
   when the page is absent or unshipped for the locale
   (`renderDocsSlugPage`).
3. **Compile-graph / denylist ledgers** — retired App Router modules, owned
   paths, and export HTML are audited against
   `RETIRED_PUBLIC_ROUTE_FAMILIES` /
   `RETIRED_AI_CONTENT_OWNED_PATHS`
   (`src/lib/governance/retired-ai-content-infrastructure-denylist.ts` +
   legacy compile-graph audit). Reintroduction fails the gate.
4. **Discovery exclusion** — sitemap (`listPublicSitemapRoutes`), robots,
   search URL prefixes (`RETIRED_ATLAS_SEARCH_URL_PREFIXES`), and absolute
   canonical proofs all fail-closed via `isLiveFactoryCanonicalPath` (and
   related search helpers). Retired paths must not appear as competing
   canonical sitemap entries.

These patterns prove how the site **stops advertising** deleted destinations
under static export. They are **not** a drop-in “old URL → new URL”
compatibility page. Migrating live `/docs/documentation/*` content to
`/docs/references|factories|workers|workstations/...` will need an additional
static compatibility document or equivalent tested mechanism (planned under
W18 / plan US-011), reusing the canonical-declaration and sitemap-exclusion
rules above so old routes do not compete with new ones.

### Tests and ledgers that prove today’s behavior

| Concern | Primary proofs |
| --- | --- |
| Absolute production canonicals | `src/lib/seo/export-absolute-canonical.test.ts`, `verifyExportAbsoluteCanonicals` |
| Sitemap include/exclude | `src/lib/seo/public-sitemap-routes.ts` (+ `.test.ts`), `export-sitemap.test.ts` |
| Localized alternates | `src/lib/seo/export-localized-alternates.test.ts`, `src/tests/layout/localized-route-metadata.test.ts` |
| Composite export SEO gate | `src/lib/seo/verify-export-seo-discovery.ts` (+ `.test.ts`) |
| Retired static params / compile graph | `src/lib/build/static-export-legacy-compile-graph.test.ts` |
| Process map | `docs/internal/processes/static-seo-metadata-relevant-files.md`, `delete-atlas-domain-relevant-files.md` |

### Plan migration inventory (target move set — not implemented here)

From `docs/temp/references/plan.md` §10. Every row below is a **future**
compatibility obligation for the migration lane; current checkout still
serves the left-hand paths as ordinary documentation pages (where published):

| Current route | Target route |
| --- | --- |
| `/docs/documentation/api-doc` | `/docs/references/api` |
| `/docs/documentation/cli-command-index` | `/docs/references/cli` |
| `/docs/documentation/configuration` | `/docs/factories/configuration` |
| `/docs/documentation/global-configuration-factories` | `/docs/factories/global-configuration` |
| `/docs/documentation/packaged-factories` | `/docs/factories/packaged` |
| `/docs/documentation/dynamic-workflows` | `/docs/factories/dynamic-workflows` |
| `/docs/documentation/factory-session` | `/docs/factories/sessions` |
| `/docs/documentation/workers` | `/docs/workers` |
| `/docs/documentation/agent-workers` | `/docs/workers/agent` |
| `/docs/documentation/inference-workers` | `/docs/workers/inference` |
| `/docs/documentation/script-workers` | `/docs/workers/script` |
| `/docs/documentation/poller-workers` | `/docs/workers/poller` |
| `/docs/documentation/mock-workers` | `/docs/workers/mock` |
| `/docs/documentation/workstations` | `/docs/workstations` |

Plan expectation (verbatim intent): each old route must resolve to a static
compatibility page or other supported static mechanism and declare the new
canonical; every old route needs one explicit outcome. **W00 does not
implement those outcomes.**
