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
  lists / recordings.
- Quality gate: `make check` (typecheck + lint) and targeted
  `bun test src/features/factory-replay/`.
