# Shared controlled factory-replay — relevant files

Process notes for the host-controlled work-graph replay feature under
`src/features/factory-replay/**`.

## Ownership boundary

- **Own:** `src/features/factory-replay/**` only.
- **Do not edit from this lane:** generated packaged-factory artifacts, reference
  pages, landing modules, route loaders, package dependency pins, or global CSS.
- Callers inject one serializable `FactoryRecording` (or equivalent) so route
  code controls which recording module enters the client graph.

## Pure playback (story 001+)

| Concern | Location |
| --- | --- |
| Reset / Play / Pause / Select / Follow latest / Advance | `playback-transitions.ts` → `reducePlayback` |
| Initial paused-at-latest state | `createInitialPlaybackState` |
| Event → tick list | `listRecordedTicks` |
| Public re-exports | `index.ts` |

Rules:

- Transitions are pure: no `setTimeout`, DOM, or React.
- Illegal Select (outside earliest/latest or not a recorded tick) returns the
  **same** state reference (no-op).
- `Advance` wraps final → earliest so a later single chained 2000 ms autoplay
  timeout can hold on the final tick then loop by calling Advance again.
- Playing is an explicit boolean; Advance does not toggle it.

## Projection preparation + cache (story 002+)

| Concern | Location |
| --- | --- |
| Prepare topology / activity / load / work-progress at tick | `projection-cache.ts` → `prepareReplayProjectionAtTick` |
| Per-recording / per-tick object cache | `createReplayProjectionCache` |
| Small injectable fixtures | `fixtures.ts` |

Rules:

- Call only public `@you-agent-factory/factory-replay` `*AtTick` helpers (plus
  `canonicalizeFactoryEvents`). Never import `FactoryRecordingTopologyReplay`.
- Cache identity is `recording.id` plus the raw `recording.events` reference
  (canonicalize once per bind — `canonicalizeFactoryEvents` always allocates);
  switching recordings clears entries so A’s ticks never leak into B.
- Cache hits return the **same** `PreparedReplayProjection` object reference.
- Soft cap: `MAX_CACHED_REPLAY_PROJECTIONS` (32), oldest Map key evicted first.

## Autoplay scheduler (story 003+)

| Concern | Location |
| --- | --- |
| Single chained 2000 ms timeout | `autoplay-scheduler.ts` → `createAutoplayScheduler` |
| Cadence constant | `AUTOPLAY_INTERVAL_MS` (`2000`) |

Rules:

- Own **at most one** pending timeout handle. Prefer one handle replaced on
  each schedule (chained), never overlapping parallel advance timers.
- `sync({ playing, allowed })` aligns the timer with host play + gate state;
  Pause / Reset / `allowed: false` / `dispose()` clear any pending timeout.
- On fire: call the Advance callback, then chain the next timeout only if still
  playing and allowed. Final-tick hold+loop comes from `reducePlayback` Advance
  wrapping final → earliest after one full cadence on the final tick.
- Inject `setTimeout` / `clearTimeout` in tests (manual fake clock) so cadence
  assertions never depend on wall-clock flakiness. Gates (story 004) only flip
  `allowed`; they do not own a second timer.

## Autoplay gates (story 004+)

| Concern | Location |
| --- | --- |
| Pure allowed decision | `autoplay-gates.ts` → `isAutoplayAllowed` |
| Session + opt-in override | `createAutoplayGateSession` |
| DOM binding + cleanup | `bindAutoplayGateDom` |
| Reduced-motion query | `REDUCED_MOTION_MEDIA_QUERY` |

Rules:

- Gates flip scheduler `allowed` only — never schedule a second timeout.
- `allowed` requires document visible **and** root intersecting.
- `prefers-reduced-motion: reduce` blocks autoplay until
  `notifyExplicitPlay()` (user opt-in for that session). `notifyStopped()` on
  Pause/Reset clears the opt-in.
- When reduce newly activates, clear opt-in, set `allowed: false`, and fire
  `onRequestPause` so the host can Pause. Playback starts paused under reduce
  (`shouldStartPlaybackPaused` / `createInitialPlaybackState`).
- `bindAutoplayGateDom` must remove visibility / matchMedia / IntersectionObserver
  listeners on dispose. Fixture tests simulate signals — do not require a route
  mount.

## Full-mode composition (story 005+)

| Concern | Location |
| --- | --- |
| Pure scrubber / topology / progress mapping | `full-mode-composition.ts` → `deriveFullModeComposition` |
| Host playback + cache + autoplay + gates hook | `use-controlled-factory-replay.ts` |
| Full-mode React composition | `controlled-factory-replay-full.tsx` |
| Default visualizer message contracts | `default-messages.ts` |

Rules:

- Compose `FactoryTimelineScrubber`, `FactoryTopologyReplay`, and
  `WorkProgressVisualizer` only — never `FactoryRecordingTopologyReplay`.
- Host owns selected tick via `reducePlayback`; visualizers receive prepared
  projections / scrubber state only.
- `presentationStatus` `loading` / `failed` → scrubber `unavailable` + matching
  topology status; `ready` → available scrubber and topology empty/ready from
  node count.
- Attach `rootRef` from the hook to the replay root for intersection gating.
  Tests may pass `bindDomGates={false}`.
- **Strict Mode / remount:** create `createAutoplayScheduler` +
  `createAutoplayGateSession` inside the mount effect and **null the refs on
  cleanup**. Do not lazy-init once into refs during render and dispose in an
  effect — React Strict Mode preserves refs across cleanup→setup, so a disposed
  instance would permanently kill autoplay in `make dev`. Fixture coverage:
  `use-controlled-factory-replay.test.tsx` (fake clock + `<StrictMode>`).

## Compact-mode composition (story 006+)

| Concern | Location |
| --- | --- |
| Pure topology + tick/timeline position mapping | `compact-mode-composition.ts` → `deriveCompactModeComposition` |
| Compact React composition | `controlled-factory-replay-compact.tsx` |

Rules:

- Reuse `useControlledFactoryReplay` (same transitions, cache, cadence, gates).
- Compose `FactoryTopologyReplay` plus visible tick + timeline position text and
  Play/Pause only — never `WorkProgressVisualizer` or
  `FactoryRecordingTopologyReplay`.
- Do not mount `FactoryTimelineScrubber` in compact; show position via chrome /
  timeline message helpers (`selectedTick`, `position`).
- `progressVisible` is always `false`; fixture tests assert Work progress
  region present in full and absent in compact for the same recording.
- Tests may pass `bindDomGates={false}`.

## Frozen public client API (story 007+)

| Concern | Location |
| --- | --- |
| Public mode entry (`recording` + `mode`) | `controlled-factory-replay.tsx` → `ControlledFactoryReplay` |
| Mode union | `ControlledFactoryReplayMode` (`"full"` \| `"compact"`) |
| Barrel re-exports | `index.ts` |
| Injectable fixtures | `fixtures.ts` |

Rules:

- Prefer `ControlledFactoryReplay` for route / landing callers: inject **one**
  serializable recording and set `mode`. Do not import generated packaged-factory
  corpus, reference pages, landing modules, route loaders, dependency manifests,
  or global CSS from this feature.
- Full and compact compositions remain available for direct mounts; the public
  entry only dispatches on `mode` over the same controller contracts.
- Fixture suite under `src/features/factory-replay/**` covers transitions,
  projection cache, 2000 ms cadence (hold/loop), gates, cleanup, and full vs
  compact region differences — no route mount required.
- Ownership for this lane stays inside `src/features/factory-replay/**`.

## Packaged dependencies (consume, do not re-own)

| Package | Use |
| --- | --- |
| `@you-agent-factory/client` | `FactoryRecording` / parse helpers when validating injected input |
| `@you-agent-factory/factory-replay` | `projectFactoryTopologyAtTick`, activity/load/work-progress at tick |
| `@you-agent-factory/factory-visualizers` | `FactoryTimelineScrubber`, `FactoryTopologyReplay`, `WorkProgressVisualizer` |

**Avoid:** `FactoryRecordingTopologyReplay` — it owns selected-tick state and
fights host-controlled cadence.

## Verification

- Fixture tests under `src/features/factory-replay/**` with small injected tick
  lists / recordings (`fixtures.ts`).
- Quality gate: `make check` (typecheck + lint) and targeted
  `bun test src/features/factory-replay/`.
