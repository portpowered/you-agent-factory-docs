/**
 * Pure playback transitions for host-controlled factory replay.
 *
 * Deterministic Reset / Play / Pause / Select tick / Follow latest / Advance
 * updates only. No timers, DOM, or React side effects.
 */

export type PlaybackMode = "current" | "history";

export type PlaybackState = {
  readonly earliestTick: number;
  readonly latestTick: number;
  readonly mode: PlaybackMode;
  readonly playing: boolean;
  readonly selectedTick: number;
  /** Ascending unique recorded ticks for this recording identity. */
  readonly ticks: readonly number[];
};

export type PlaybackAction =
  | { readonly type: "reset" }
  | { readonly type: "play" }
  | { readonly type: "pause" }
  | { readonly type: "selectTick"; readonly tick: number }
  | { readonly type: "followLatest" }
  | { readonly type: "advance" };

type TickBearingEvent = {
  readonly context: {
    readonly tick: number;
  };
};

/**
 * Unique ascending logical ticks from recording events.
 * Empty event lists use `[0]` so scrubber bounds stay defined.
 */
export function listRecordedTicks(
  events: readonly TickBearingEvent[],
): number[] {
  const unique = [...new Set(events.map((event) => event.context.tick))];
  unique.sort((left, right) => left - right);
  return unique.length > 0 ? unique : [0];
}

function freezeTicks(ticks: readonly number[]): readonly number[] {
  return Object.freeze([...ticks]);
}

function modeForSelectedTick(
  selectedTick: number,
  latestTick: number,
): PlaybackMode {
  return selectedTick === latestTick ? "current" : "history";
}

function normalizeRecordedTicks(ticks: readonly number[]): readonly number[] {
  if (ticks.length === 0) {
    return freezeTicks(listRecordedTicks([]));
  }
  const unique = [...new Set(ticks)].sort((left, right) => left - right);
  return freezeTicks(unique);
}

/**
 * Initial paused playback at the latest recorded tick (current mode).
 */
export function createInitialPlaybackState(
  ticks: readonly number[],
): PlaybackState {
  const normalized = normalizeRecordedTicks(ticks);
  const earliestTick = normalized[0] ?? 0;
  const latestTick = normalized[normalized.length - 1] ?? 0;
  return {
    earliestTick,
    latestTick,
    mode: "current",
    playing: false,
    selectedTick: latestTick,
    ticks: normalized,
  };
}

function isRecordedTick(state: PlaybackState, tick: number): boolean {
  return (
    Number.isSafeInteger(tick) &&
    tick >= state.earliestTick &&
    tick <= state.latestTick &&
    state.ticks.includes(tick)
  );
}

/**
 * Apply one playback action. Illegal Select ticks no-op and return `state`
 * unchanged (same reference). Never mutates caller data or schedules timers.
 */
export function reducePlayback(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  switch (action.type) {
    case "reset":
      return createInitialPlaybackState(state.ticks);

    case "play":
      if (state.playing) {
        return state;
      }
      return { ...state, playing: true };

    case "pause":
      if (!state.playing) {
        return state;
      }
      return { ...state, playing: false };

    case "selectTick": {
      if (!isRecordedTick(state, action.tick)) {
        return state;
      }
      const mode = modeForSelectedTick(action.tick, state.latestTick);
      if (state.selectedTick === action.tick && state.mode === mode) {
        return state;
      }
      return {
        ...state,
        mode,
        selectedTick: action.tick,
      };
    }

    case "followLatest": {
      if (state.mode === "current" && state.selectedTick === state.latestTick) {
        return state;
      }
      return {
        ...state,
        mode: "current",
        selectedTick: state.latestTick,
      };
    }

    case "advance": {
      const index = state.ticks.indexOf(state.selectedTick);
      if (index < 0) {
        return state;
      }
      const nextIndex = (index + 1) % state.ticks.length;
      const selectedTick = state.ticks[nextIndex] ?? state.latestTick;
      const mode = modeForSelectedTick(selectedTick, state.latestTick);
      if (selectedTick === state.selectedTick && mode === state.mode) {
        return state;
      }
      return {
        ...state,
        mode,
        selectedTick,
      };
    }

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
