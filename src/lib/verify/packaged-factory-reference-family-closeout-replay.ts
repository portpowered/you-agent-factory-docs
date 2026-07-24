/**
 * Batch 5 packaged-factory reference family closeout — story 003 proofs.
 *
 * Tip-owned evidence that full-mode child replay and landing compact goal
 * replay share the factory-replay playback core:
 * - single chained 2000 ms autoplay cadence
 * - final-tick hold then Advance wrap
 * - manual Play/Pause override
 * - dispose/cleanup clears the pending timeout
 * - document-hidden, offscreen, and reduced-motion gates pause autoplay
 * - goal child + landing Youi consume the same generated goal recording
 *
 * Composes Batch 3 shared factory-replay modules and Batch 4 goal / Youi
 * mounts. Does not redesign replay internals or regenerate recordings.
 */

import { parseFactoryRecording } from "@you-agent-factory/client";
import goalRecordingJson from "@/content/docs/references/packaged-factories-index/generated/goal.factory-recording.v1.json";
import {
  AUTOPLAY_INTERVAL_MS,
  type AutoplaySchedulerTimers,
  type AutoplayTimerHandle,
  createAutoplayGateSession,
  createAutoplayScheduler,
  createInitialPlaybackState,
  isAutoplayAllowed,
  reducePlayback,
  shouldStartPlaybackPaused,
} from "@/features/factory-replay";
import { YOUI_COMPACT_GOAL_RECORDING } from "@/features/landing-page/components/YouiCompactGoalReplayIsland";

/** Locked goal recording identity shared by the goal child and landing Youi. */
export const PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID =
  "packaged-goal-sample" as const;

/** Shared autoplay cadence required on tip for full + compact hosts. */
export const PACKAGED_FACTORY_CLOSEOUT_AUTOPLAY_INTERVAL_MS = 2000 as const;

/** Multi-tick fixture used only for pure cadence / final-hold proofs. */
export const PACKAGED_FACTORY_CLOSEOUT_REPLAY_PROOF_TICKS = [1, 2, 4] as const;

export type PackagedFactoryCloseoutReplayCadenceEvidence = {
  autoplayIntervalMs: typeof PACKAGED_FACTORY_CLOSEOUT_AUTOPLAY_INTERVAL_MS;
  advancesAtCadence: true;
  finalTickHeldOneCadenceBeforeWrap: true;
  pendingTimeoutCountWhilePlaying: 1;
};

export type PackagedFactoryCloseoutReplayGateEvidence = {
  hiddenPauses: true;
  offscreenPauses: true;
  reducedMotionGatesUntilExplicitPlay: true;
};

export type PackagedFactoryCloseoutReplayCleanupEvidence = {
  disposeClearsPendingTimeout: true;
  postDisposeAdvances: 0;
};

export type PackagedFactoryCloseoutSharedGoalRecordingEvidence = {
  recordingId: typeof PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID;
  goalChildRecordingId: string;
  landingRecordingId: string;
  sharedArtifactPath: "generated/goal.factory-recording.v1.json";
};

export type PackagedFactoryCloseoutReplayEvidence = {
  cadence: PackagedFactoryCloseoutReplayCadenceEvidence;
  gates: PackagedFactoryCloseoutReplayGateEvidence;
  cleanup: PackagedFactoryCloseoutReplayCleanupEvidence;
  sharedGoalRecording: PackagedFactoryCloseoutSharedGoalRecordingEvidence;
};

export class PackagedFactoryCloseoutReplayError extends Error {
  readonly code:
    | "wrong-cadence"
    | "cadence-advance-failed"
    | "final-hold-failed"
    | "manual-override-failed"
    | "cleanup-failed"
    | "gate-failed"
    | "shared-recording-mismatch";

  constructor(
    code: PackagedFactoryCloseoutReplayError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCloseoutReplayError";
    this.code = code;
  }
}

type PendingTimeout = {
  readonly callback: () => void;
  readonly delayMs: number;
  readonly id: number;
  dueAt: number;
};

/**
 * Deterministic fake clock for closeout cadence proofs — never wall-clock.
 */
export function createPackagedFactoryCloseoutFakeTimers(): AutoplaySchedulerTimers & {
  advance(ms: number): void;
  pendingCount(): number;
} {
  let nextId = 1;
  let now = 0;
  const pending = new Map<number, PendingTimeout>();

  return {
    advance(ms: number): void {
      now += ms;
      const due = [...pending.values()]
        .filter((entry) => entry.dueAt <= now)
        .sort((left, right) => left.dueAt - right.dueAt || left.id - right.id);
      for (const entry of due) {
        if (!pending.has(entry.id)) {
          continue;
        }
        pending.delete(entry.id);
        entry.callback();
      }
    },
    clearTimeout(handle: AutoplayTimerHandle): void {
      pending.delete(handle as unknown as number);
    },
    pendingCount(): number {
      return pending.size;
    },
    setTimeout(callback: () => void, delayMs: number): AutoplayTimerHandle {
      const id = nextId;
      nextId += 1;
      pending.set(id, { callback, delayMs, dueAt: now + delayMs, id });
      return id as unknown as AutoplayTimerHandle;
    },
  };
}

/**
 * Fail closed unless the shared factory-replay cadence constant stays 2000 ms.
 */
export function assertPackagedFactoryCloseoutAutoplayCadenceMs(): void {
  if (AUTOPLAY_INTERVAL_MS !== PACKAGED_FACTORY_CLOSEOUT_AUTOPLAY_INTERVAL_MS) {
    throw new PackagedFactoryCloseoutReplayError(
      "wrong-cadence",
      `Expected AUTOPLAY_INTERVAL_MS ${PACKAGED_FACTORY_CLOSEOUT_AUTOPLAY_INTERVAL_MS}, got ${AUTOPLAY_INTERVAL_MS}.`,
    );
  }
}

/**
 * Read selectedTick as a plain number so control-flow narrowing does not pin a
 * literal tick across later cadence assertions.
 */
function selectedTickNumber(state: { readonly selectedTick: number }): number {
  return state.selectedTick;
}

/**
 * Prove single chained 2000 ms cadence, final-tick hold for one cadence, then
 * Advance wrap to earliest — plus manual Pause clearing the pending timeout.
 */
export function provePackagedFactoryCloseoutSharedPlaybackCadence(
  clock = createPackagedFactoryCloseoutFakeTimers(),
): PackagedFactoryCloseoutReplayCadenceEvidence {
  assertPackagedFactoryCloseoutAutoplayCadenceMs();

  let state = createInitialPlaybackState(
    PACKAGED_FACTORY_CLOSEOUT_REPLAY_PROOF_TICKS,
  );
  // Start at earliest so we can observe 1 → 2 → 4 (final) → hold → wrap to 1.
  state = reducePlayback(state, { type: "selectTick", tick: 1 });
  state = reducePlayback(state, { type: "play" });

  const scheduler = createAutoplayScheduler(() => {
    state = reducePlayback(state, { type: "advance" });
  }, clock);

  scheduler.sync({ playing: true, allowed: true });
  if (clock.pendingCount() !== 1 || !scheduler.isScheduled()) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "cadence-advance-failed",
      "Expected exactly one pending autoplay timeout while playing and allowed.",
    );
  }

  clock.advance(AUTOPLAY_INTERVAL_MS - 1);
  if (selectedTickNumber(state) !== 1) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "cadence-advance-failed",
      `Advance fired early before ${AUTOPLAY_INTERVAL_MS} ms (tick=${selectedTickNumber(state)}).`,
    );
  }

  clock.advance(1);
  if (selectedTickNumber(state) !== 2 || clock.pendingCount() !== 1) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "cadence-advance-failed",
      `Expected tick 2 after one cadence with one chained timeout, got tick=${selectedTickNumber(state)} pending=${clock.pendingCount()}.`,
    );
  }

  clock.advance(AUTOPLAY_INTERVAL_MS);
  if (selectedTickNumber(state) !== 4) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "final-hold-failed",
      `Expected final tick 4 after second cadence, got ${selectedTickNumber(state)}.`,
    );
  }

  // Final-tick hold: stay on 4 for a full cadence, then wrap to earliest.
  clock.advance(AUTOPLAY_INTERVAL_MS - 1);
  if (selectedTickNumber(state) !== 4) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "final-hold-failed",
      `Final tick did not hold for a full ${AUTOPLAY_INTERVAL_MS} ms cadence (tick=${selectedTickNumber(state)}).`,
    );
  }

  clock.advance(1);
  if (selectedTickNumber(state) !== 1) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "final-hold-failed",
      `Expected Advance wrap final→earliest after hold, got tick ${selectedTickNumber(state)}.`,
    );
  }

  state = reducePlayback(state, { type: "pause" });
  scheduler.sync({ playing: false, allowed: true });
  if (scheduler.isScheduled() || clock.pendingCount() !== 0) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "manual-override-failed",
      "Pause must clear the pending autoplay timeout.",
    );
  }

  const tickAfterPause = selectedTickNumber(state);
  clock.advance(AUTOPLAY_INTERVAL_MS * 2);
  if (selectedTickNumber(state) !== tickAfterPause || state.playing) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "manual-override-failed",
      "Paused playback must not advance after Pause.",
    );
  }

  scheduler.dispose();
  return {
    autoplayIntervalMs: PACKAGED_FACTORY_CLOSEOUT_AUTOPLAY_INTERVAL_MS,
    advancesAtCadence: true,
    finalTickHeldOneCadenceBeforeWrap: true,
    pendingTimeoutCountWhilePlaying: 1,
  };
}

/**
 * Prove document-hidden, offscreen, and reduced-motion gates pause autoplay
 * without owning a second timer.
 */
export function provePackagedFactoryCloseoutAutoplayGates(
  clock = createPackagedFactoryCloseoutFakeTimers(),
): PackagedFactoryCloseoutReplayGateEvidence {
  assertPackagedFactoryCloseoutAutoplayCadenceMs();

  let state = createInitialPlaybackState(
    PACKAGED_FACTORY_CLOSEOUT_REPLAY_PROOF_TICKS,
  );
  state = reducePlayback(state, { type: "selectTick", tick: 1 });
  state = reducePlayback(state, { type: "play" });

  const scheduler = createAutoplayScheduler(() => {
    state = reducePlayback(state, { type: "advance" });
  }, clock);

  const gates = createAutoplayGateSession({
    onChange: (decision) => {
      scheduler.sync({ playing: state.playing, allowed: decision.allowed });
    },
  });

  scheduler.sync({
    playing: true,
    allowed: gates.getDecision().allowed,
  });

  gates.setDocumentVisible(false);
  if (
    gates.getDecision().allowed ||
    scheduler.isScheduled() ||
    clock.pendingCount() !== 0
  ) {
    scheduler.dispose();
    gates.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "Document-hidden must clear autoplay scheduling.",
    );
  }
  clock.advance(AUTOPLAY_INTERVAL_MS * 2);
  if (state.selectedTick !== 1) {
    scheduler.dispose();
    gates.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "Document-hidden must prevent Advance while still playing.",
    );
  }
  gates.setDocumentVisible(true);

  gates.setIntersecting(false);
  if (gates.getDecision().allowed || scheduler.isScheduled()) {
    scheduler.dispose();
    gates.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "Offscreen / non-intersecting root must clear autoplay scheduling.",
    );
  }
  clock.advance(AUTOPLAY_INTERVAL_MS * 2);
  if (state.selectedTick !== 1) {
    scheduler.dispose();
    gates.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "Offscreen root must prevent Advance.",
    );
  }
  gates.setIntersecting(true);

  // Reduced motion: gated until explicit Play opt-in; Pause clears opt-in.
  gates.setPrefersReducedMotion(true);
  if (
    !shouldStartPlaybackPaused(true) ||
    isAutoplayAllowed(gates.getDecision().signals, false)
  ) {
    scheduler.dispose();
    gates.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "Reduced motion must start paused and block autoplay without opt-in.",
    );
  }

  state = reducePlayback(state, { type: "play" });
  scheduler.sync({
    playing: true,
    allowed: gates.getDecision().allowed,
  });
  if (scheduler.isScheduled()) {
    scheduler.dispose();
    gates.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "Reduced motion must keep autoplay gated until notifyExplicitPlay.",
    );
  }

  gates.notifyExplicitPlay();
  scheduler.sync({
    playing: true,
    allowed: gates.getDecision().allowed,
  });
  if (!gates.getDecision().allowed || !scheduler.isScheduled()) {
    scheduler.dispose();
    gates.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "Explicit Play under reduced motion must unlock autoplay.",
    );
  }

  state = reducePlayback(state, { type: "pause" });
  gates.notifyStopped();
  scheduler.sync({
    playing: false,
    allowed: gates.getDecision().allowed,
  });
  if (
    gates.getDecision().explicitPlayWhileReducedMotion ||
    gates.getDecision().allowed ||
    scheduler.isScheduled()
  ) {
    scheduler.dispose();
    gates.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "gate-failed",
      "Pause must clear reduced-motion opt-in and stop autoplay.",
    );
  }

  scheduler.dispose();
  gates.dispose();
  return {
    hiddenPauses: true,
    offscreenPauses: true,
    reducedMotionGatesUntilExplicitPlay: true,
  };
}

/**
 * Prove dispose/unmount clears the pending autoplay timeout permanently.
 */
export function provePackagedFactoryCloseoutAutoplayCleanup(
  clock = createPackagedFactoryCloseoutFakeTimers(),
): PackagedFactoryCloseoutReplayCleanupEvidence {
  assertPackagedFactoryCloseoutAutoplayCadenceMs();

  let advances = 0;
  const scheduler = createAutoplayScheduler(() => {
    advances += 1;
  }, clock);

  scheduler.sync({ playing: true, allowed: true });
  if (clock.pendingCount() !== 1) {
    scheduler.dispose();
    throw new PackagedFactoryCloseoutReplayError(
      "cleanup-failed",
      "Expected one pending timeout before dispose.",
    );
  }

  scheduler.dispose();
  if (scheduler.isScheduled() || clock.pendingCount() !== 0) {
    throw new PackagedFactoryCloseoutReplayError(
      "cleanup-failed",
      "dispose() must clear the pending autoplay timeout.",
    );
  }

  clock.advance(AUTOPLAY_INTERVAL_MS * 2);
  scheduler.sync({ playing: true, allowed: true });
  if (advances !== 0 || scheduler.isScheduled() || clock.pendingCount() !== 0) {
    throw new PackagedFactoryCloseoutReplayError(
      "cleanup-failed",
      "Disposed scheduler must ignore later sync and never Advance.",
    );
  }

  return {
    disposeClearsPendingTimeout: true,
    postDisposeAdvances: 0,
  };
}

/**
 * Prove goal child and landing Youi consume the same generated goal recording.
 */
export function provePackagedFactoryCloseoutSharedGoalRecording(): PackagedFactoryCloseoutSharedGoalRecordingEvidence {
  const fromArtifact = parseFactoryRecording(goalRecordingJson);
  const landing = YOUI_COMPACT_GOAL_RECORDING;

  if (fromArtifact.id !== PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID) {
    throw new PackagedFactoryCloseoutReplayError(
      "shared-recording-mismatch",
      `Expected generated goal recording id ${PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID}, got ${fromArtifact.id}.`,
    );
  }
  if (landing.id !== fromArtifact.id) {
    throw new PackagedFactoryCloseoutReplayError(
      "shared-recording-mismatch",
      `Landing Youi recording id ${landing.id} does not match generated goal recording ${fromArtifact.id}.`,
    );
  }
  if (landing.title !== fromArtifact.title) {
    throw new PackagedFactoryCloseoutReplayError(
      "shared-recording-mismatch",
      `Landing Youi recording title drifted from generated goal artifact (${landing.title} vs ${fromArtifact.title}).`,
    );
  }
  if (landing.events.length !== fromArtifact.events.length) {
    throw new PackagedFactoryCloseoutReplayError(
      "shared-recording-mismatch",
      "Landing Youi event count drifted from generated goal artifact.",
    );
  }

  return {
    recordingId: PACKAGED_FACTORY_CLOSEOUT_GOAL_RECORDING_ID,
    goalChildRecordingId: fromArtifact.id,
    landingRecordingId: landing.id,
    sharedArtifactPath: "generated/goal.factory-recording.v1.json",
  };
}

/**
 * Run the full tip closeout proof pack for shared replay cadence / gates.
 */
export function provePackagedFactoryReferenceFamilyCloseoutReplay(): PackagedFactoryCloseoutReplayEvidence {
  return {
    cadence: provePackagedFactoryCloseoutSharedPlaybackCadence(),
    gates: provePackagedFactoryCloseoutAutoplayGates(),
    cleanup: provePackagedFactoryCloseoutAutoplayCleanup(),
    sharedGoalRecording: provePackagedFactoryCloseoutSharedGoalRecording(),
  };
}
