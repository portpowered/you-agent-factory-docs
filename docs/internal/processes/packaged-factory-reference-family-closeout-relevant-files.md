# Packaged Factory Reference Family Closeout Relevant Files

Use these files when closing Batches 1–4 packaged-factory reference surfaces as
one tip-owned family (index + seven children + landing Youi compact goal
replay).

## Ownership fence

This lane owns only:

- closeout evidence / verification under `src/lib/verify/packaged-factory-reference-family-closeout-*`
- narrow integration fixes required to keep family behavior and repository
  gates green on the converged tip
- reproducible evidence notes in `progress.txt` / PR conversation

Do **not** regenerate the committed corpus unless hash/drift gates fail closed.
Do **not** redesign shared factory-replay internals, parent index ownership,
child page bodies, landing composition, package pins, or global CSS unless a
concrete closeout failure requires a minimal fix in that surface. Prefer fixing
avoidable import leakage over raising budget ceilings.

## Key files (story 001 — deterministic corpus hashes + unabridged index)

| Path | Role |
| --- | --- |
| `src/lib/verify/packaged-factory-reference-family-closeout-corpus.ts` | Closeout-owned tip proof helpers: deterministic generate, manifest 0.0.2 + SHA-256 source-hash contract, unabridged definition alignment |
| `src/lib/verify/packaged-factory-reference-family-closeout-corpus.test.tsx` | Pure fail-closed + live tip proofs (generate twice, committed drift/hashes, accessible unabridged panels) |
| `src/lib/packaged-factory-generated-source-corpus/verify-committed-corpus.ts` | Reused Batch 2 committed regeneration + source-hash verify (do not fork) |
| `src/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index.ts` | Reused generate path for byte-stability proof |
| `src/content/docs/references/packaged-factories-index/generated/manifest.json` | Committed packageVersion + `sourceHashes[]` contract under test |
| `src/content/docs/references/packaged-factories-index/generated/factories/*.factory.json` | Committed unabridged definition bytes panels must match |
| `src/content/docs/references/packaged-factories-index/PackagedFactoriesIndex.tsx` | Parent index renderer (read-only for story 001 unless panels regress) |
| `src/content/docs/references/packaged-factories-index/project-packaged-factories-index.ts` | Pure corpus → panel projection (read-only) |

### Story 001 acceptance mapping

1. **Deterministic generation** —
   `assertPackagedFactoryCloseoutGenerationIsDeterministic` runs
   `generatePackagedFactoriesIndex` twice into a temp dir and requires
   `changedCount === 0` with identical bundle file bytes.
2. **Package version + source hashes** —
   `assertPackagedFactoryCloseoutManifestContract` requires `packageVersion`
   `0.0.2` and lowercase 64-char hex SHA-256 entries for every allowlisted
   `factories/<slug>/factory.json` plus the deep-research companion JS path, in
   docs order. `provePackagedFactoryReferenceFamilyCloseoutCorpus` also calls
   `verifyCommittedPackagedFactoriesIndex` and recomputes hashes from committed
   artifact bytes.
3. **Unabridged index panels** — projected `definitionText` and rendered
   `data-testid="packaged-factory-definition-<slug>"` `<pre>` panels must equal
   committed `factories/<slug>.factory.json` UTF-8 bytes (and
   `generated/index.json` `factoryJsonText`).

## Key files (story 002 — exact raw JavaScript + minimal deep-research child)

| Path | Role |
| --- | --- |
| `src/lib/verify/packaged-factory-reference-family-closeout-deep-research.ts` | Closeout-owned tip proof helpers: companion exactness vs live acquire, no derived companion fields, JavaScript-only pass-through display, deep-research child message/DOM forbidden-surface asserts |
| `src/lib/verify/packaged-factory-reference-family-closeout-deep-research.test.tsx` | Pure fail-closed + live tip proofs (companion bytes, JS-only CodePanel, purpose/usage/two-link child) |
| `src/lib/verify/assert-packaged-factory-reference-family-closeout-deep-research-browser.ts` | Playwright browser probe for the deep-research child on a unique port |
| `src/lib/packaged-factory-generated-source-corpus/acquire-companion-source.ts` | Reused live companion acquisition (do not fork) |
| `src/content/docs/references/packaged-factories-index/generated/deep-research.source.json` | Committed exact companion UTF-8 contract under test |
| `src/content/docs/references/packaged-factories-index/deep-research/` | Minimal child page (read-only unless tip regresses) |

### Story 002 acceptance mapping

1. **Exact raw JavaScript display** —
   `provePackagedFactoryCloseoutExactCompanionJavascript` requires committed
   `deep-research.source.json` === `index.json` `companionSource` === live
   `acquireDeepResearchCompanionSource` UTF-8 bytes + SHA-256, with only
   allowed metadata keys (no stages/workers/callGraph/ast/summary). The
   JavaScript-only index path renders those same companion bytes through
   `PackagedFactoriesIndex` without rewriting.
2. **Minimal deep-research child** —
   `assertPackagedFactoryCloseoutDeepResearchChildMessages` + rendered page
   proofs require Purpose body, one `Usage` fenced invocation, and links to
   `/docs/references/javascript-runtime` and `/docs/factories/dynamic-workflows`
   only (no teaching-chrome section keys).
3. **No child raw-source / replay duplication** — forbidden selectors
   (`[data-factory-replay*]`, `[data-factory-visualizer]`,
   `[data-packaged-factory-definition*]`, schema expand markers) must be absent
   on the child; non-replay MDX map stays empty and never equals the shared
   replay map.

## Key files (story 003 — shared replay cadence / gates / shared goal recording)

| Path | Role |
| --- | --- |
| `src/lib/verify/packaged-factory-reference-family-closeout-replay.ts` | Closeout-owned tip proof helpers: 2000 ms cadence, final-tick hold, manual Pause, cleanup, hidden/offscreen/reduced-motion gates, shared goal recording identity |
| `src/lib/verify/packaged-factory-reference-family-closeout-replay.test.tsx` | Pure fail-closed + tip mounts (`GoalFactoryReplay` full, Youi compact) + hook cadence/cleanup with fake clock |
| `src/lib/verify/assert-packaged-factory-reference-family-closeout-replay-browser.ts` | Playwright probe against static `out/` (or `CLOSEOUT_REPLAY_PROBE_BASE_URL`): goal full Play/Pause + home Youi compact Play/Pause sharing `packaged-goal-sample` |
| `src/features/factory-replay/autoplay-scheduler.ts` | Reused single chained `AUTOPLAY_INTERVAL_MS` (2000) scheduler (do not fork) |
| `src/features/factory-replay/autoplay-gates.ts` | Reused visibility / intersection / reduced-motion gates (do not fork) |
| `src/content/docs/references/packaged-factories-index/goal/GoalFactoryReplay.tsx` | Full-mode goal child mount (read-only unless tip regresses) |
| `src/features/landing-page/components/YouiCompactGoalReplayIsland.tsx` | Compact landing goal mount (read-only unless tip regresses) |
| `src/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json` | Shared generated goal recording artifact |

### Story 003 acceptance mapping

1. **2000 ms cadence + final hold** —
   `provePackagedFactoryCloseoutSharedPlaybackCadence` drives
   `createAutoplayScheduler` + `reducePlayback` on a multi-tick fixture with a
   fake clock: Advance only after each full cadence; final tick holds one
   cadence then wraps earliest. Manual Pause clears the pending timeout.
2. **Visibility gates** —
   `provePackagedFactoryCloseoutAutoplayGates` proves document-hidden,
   non-intersecting, and reduced-motion (until `notifyExplicitPlay`) clear
   scheduling without a second timer.
3. **Cleanup** — `provePackagedFactoryCloseoutAutoplayCleanup` + hook harness
   unmount prove `dispose()` / React unmount clear the pending timeout.
4. **Shared goal recording** —
   `provePackagedFactoryCloseoutSharedGoalRecording` requires parsed
   `goal.factory-recording.v1.json` === `YOUI_COMPACT_GOAL_RECORDING` id/title;
   tip mounts prove full vs compact `ControlledFactoryReplay` Play/Pause.

## Key files (story 004 — route-local import graphs + home/index exclusions)

| Path | Role |
| --- | --- |
| `src/lib/verify/packaged-factory-reference-family-closeout-import-graphs.ts` | Closeout-owned tip proof helpers: six child recording isolation, parent replay-free graphs, Youi home exclusions, positive-control detectors |
| `src/lib/verify/packaged-factory-reference-family-closeout-import-graphs.test.ts` | Pure classifier + live tip Bun.build metafile proofs |
| `src/content/docs/references/packaged-factories-index/child-recording-import-graph.ts` | Reused owned-/foreign-recording classification + child collector |
| `src/content/docs/references/packaged-factories-index/parent-import-graph.ts` | Reused parent forbidden markers + collector |
| `src/features/landing-page/youi-landing-import-graph.ts` | Reused Youi forbidden markers + collector |
| `src/features/landing-page/youi-landing-import-graph.polluted-fixture.ts` | Deliberate pollution entry so Youi exclusion asserts are not no-ops |

### Story 004 acceptance mapping

1. **Standard child recording isolation** —
   `provePackagedFactoryCloseoutStandardChildImportGraphs` collects Bun metafile
   inputs from each `<slug>/page-mdx-components.tsx` and requires the owned
   `*.factory-recording.v1.json` with zero foreign packaged recordings.
2. **Parent index replay-free** —
   `provePackagedFactoryCloseoutParentImportGraphs` proves
   `page-mdx-components.tsx` + `PackagedFactoriesIndex.tsx` reach
   `generated/index.json` and hit none of the parent forbidden markers
   (factory-replay package/feature, factory-visualizers, recordings).
3. **Home/landing Youi exclusions** —
   `provePackagedFactoryCloseoutYouiImportGraphs` proves near-viewport + island
   graphs include the goal recording and `src/features/factory-replay/`, and
   exclude non-goal recordings, `generated/index.json`, `.source.json`, and
   `generate-packaged-factories-index`.
4. **Positive-control detectors** —
   `provePackagedFactoryCloseoutImportGraphPositiveControls` collects from
   `src/features/factory-replay/index.ts` (parent detector must fire) and from
   `youi-landing-import-graph.polluted-fixture.ts` (Youi detector must observe
   non-goal / index / source markers).

## Key files (story 005 — keyboard/touch a11y, graph containment, hydration)

| Path | Role |
| --- | --- |
| `src/lib/verify/packaged-factory-reference-family-closeout-a11y.ts` | Closeout-owned tip proof helpers: keyboard-focusable Play/Pause (+ full Reset/timeline), page-overflow containment, hydration-mismatch classifier, family route/viewport contracts |
| `src/lib/verify/packaged-factory-reference-family-closeout-a11y.test.tsx` | Pure fail-closed + tip mounts (`GoalFactoryReplay` full, Youi compact) for keyboard activation |
| `src/lib/verify/assert-packaged-factory-reference-family-closeout-a11y-browser.ts` | Playwright probe against static `out/` (or `CLOSEOUT_A11Y_PROBE_BASE_URL`): family-route hydration, keyboard + mobile touch Play/Pause, mobile/wide page containment |
| `src/lib/verify/a11y-page-structure.ts` | Reused `listKeyboardFocusableControls` (do not fork) |
| `src/lib/verify/a11y-responsive-probes.ts` | Reused `measurePageLevelOverflow` (do not fork) |
| `src/lib/verify/a11y-responsive-contract.ts` | Reused `CRITICAL_VIEWPORTS` + `PAGE_OVERFLOW_TOLERANCE_PX` |

### Story 005 acceptance mapping

1. **Keyboard-operable Play/Pause (+ timeline on full)** —
   `assertPackagedFactoryCloseoutKeyboardFocusableControls` requires enabled
   Play/Pause (and full-mode Reset + `Select recorded tick` slider) via
   `listKeyboardFocusableControls`. Tip mounts prove Enter/Space + click
   toggle `data-playing`. `Follow latest` must remain present in full chrome;
   it may be disabled (not focusable) when already on the latest tick (goal
   sample is a single tick).
2. **Touch + graph containment** — browser probe taps Play/Pause at mobile
   (390) on goal full + home compact; `assertPackagedFactoryCloseoutPageContained`
   requires zero unintended page overflow at mobile (390) and wide (1440) on
   parent index, goal, deep-research, and home Youi after replay hosts are in
   view.
3. **No hydration mismatches** —
   `assertPackagedFactoryCloseoutNoHydrationMismatches` classifies console /
   pageerror text (`hydration`, `did not match`, server-rendered HTML) and
   requires zero hits on the four family routes.

## Patterns

- Closeout proofs compose Batch 2 verify/generate helpers; they do not invent a
  second acquisition policy or rewrite committed `generated/` outputs on green
  tip.
- Keep pure fail-closed asserts (manifest contract, definition mismatch) separate
  from IO (generate, committed-tree load, live verify).
- Parent index panel accessibility for story 001 is the accessible code panel
  (`<pre>` in `CodePanel`) remaining in the DOM with full unabridged text —
  scroll clipping is OK; truncation is not.
- Story 002 treats companion JavaScript as an exact UTF-8 artifact +
  JavaScript-only display contract. On tip, deep-research still ships
  `factory.json` on the parent index; companion JS is proven via committed
  artifacts + the JavaScript-only CodePanel path using those same bytes — not
  by duplicating raw source onto the child page.
- Story 003 composes Batch 3 shared factory-replay cadence/gates rather than
  forking a second autoplay stack. Use a fake clock for cadence proofs; prove
  goal-child full + landing compact mounts share `goal.factory-recording.v1.json`
  and Play/Pause through `ControlledFactoryReplay`. Interactive browser probes
  should serve trusted static `out/` (or set `CLOSEOUT_REPLAY_PROBE_BASE_URL`) —
  worktree `next dev` often fails to hydrate client islands when
  `node_modules` is parent-hoisted.
- Story 004 composes existing child / parent / Youi import-graph collectors and
  classifiers rather than forking Bun.build policy. Keep positive-control
  entrypoints (shared factory-replay + polluted Youi fixture) so exclusion
  asserts cannot silently become no-ops.
- Story 005 composes a11y keyboard/overflow probes + tip mounts rather than a
  second axe matrix. Interactive keyboard/touch + hydration probes should serve
  trusted static `out/` (or set `CLOSEOUT_A11Y_PROBE_BASE_URL`); default port
  3624. Treat disabled `Follow latest` on the single-tick goal sample as
  present-but-not-focusable, not a missing control.
- Later closeout stories (export/CSS, gates, browser evidence) should add
  sibling `packaged-factory-reference-family-closeout-*` modules rather than
  expanding earlier story modules beyond their ownership.

## Reproduce

```bash
bun run prepare:content-runtime
bun test src/lib/verify/packaged-factory-reference-family-closeout-corpus.test.tsx
bun test src/lib/verify/packaged-factory-reference-family-closeout-deep-research.test.tsx
bun test src/lib/verify/packaged-factory-reference-family-closeout-replay.test.tsx
bun test src/lib/verify/packaged-factory-reference-family-closeout-import-graphs.test.ts
bun test src/lib/verify/packaged-factory-reference-family-closeout-a11y.test.tsx
bun test src/lib/packaged-factory-generated-source-corpus/corpus-drift.test.ts
bun src/lib/verify/assert-packaged-factory-reference-family-closeout-deep-research-browser.ts
bun src/lib/verify/assert-packaged-factory-reference-family-closeout-replay-browser.ts
bun src/lib/verify/assert-packaged-factory-reference-family-closeout-a11y-browser.ts
```
