/**
 * Single chained autoplay timeout for host-controlled factory replay.
 *
 * Schedules at most one pending timeout at a time. When it fires, calls the
 * Advance callback and — if still running — chains the next 2000 ms timeout.
 * Pause / Reset / dispose clear the pending handle so no Advance fires after
 * teardown. Gates (story 004) flip `allowed` without owning a second timer.
 */

export const AUTOPLAY_INTERVAL_MS = 2000;

export type AutoplayTimerHandle = ReturnType<typeof setTimeout>;

export type AutoplaySchedulerTimers = {
  readonly clearTimeout: (handle: AutoplayTimerHandle) => void;
  readonly setTimeout: (
    callback: () => void,
    delayMs: number,
  ) => AutoplayTimerHandle;
};

export type AutoplaySchedulerSyncInput = {
  /** When false, clears any pending timeout (visibility / intersection / reduced-motion). */
  readonly allowed?: boolean;
  /** Host playback playing flag from pure transitions. */
  readonly playing: boolean;
};

export type AutoplayScheduler = {
  /** Clear any pending timeout permanently (feature unmount / teardown). */
  dispose(): void;
  /** True while exactly one advance timeout is pending. */
  isScheduled(): boolean;
  /**
   * Align the single chained timeout with host play + gate state.
   * Playing and allowed → ensure one pending timeout; otherwise clear it.
   */
  sync(input: AutoplaySchedulerSyncInput): void;
};

const defaultTimers: AutoplaySchedulerTimers = {
  clearTimeout: (handle) => {
    clearTimeout(handle);
  },
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
};

/**
 * Create an autoplay scheduler bound to one Advance callback.
 * Callers own playback state; this module only owns the timeout handle.
 */
export function createAutoplayScheduler(
  onAdvance: () => void,
  timers: AutoplaySchedulerTimers = defaultTimers,
): AutoplayScheduler {
  let pending: AutoplayTimerHandle | null = null;
  let disposed = false;
  let playing = false;
  let allowed = true;

  function clearPending(): void {
    if (pending === null) {
      return;
    }
    timers.clearTimeout(pending);
    pending = null;
  }

  function schedule(): void {
    if (disposed || pending !== null || !playing || !allowed) {
      return;
    }
    pending = timers.setTimeout(() => {
      pending = null;
      if (disposed || !playing || !allowed) {
        return;
      }
      onAdvance();
      // Chain the next cadence only when still eligible after Advance.
      schedule();
    }, AUTOPLAY_INTERVAL_MS);
  }

  return {
    dispose(): void {
      disposed = true;
      playing = false;
      clearPending();
    },
    isScheduled(): boolean {
      return pending !== null;
    },
    sync(input: AutoplaySchedulerSyncInput): void {
      if (disposed) {
        return;
      }
      playing = input.playing;
      allowed = input.allowed ?? true;
      if (!playing || !allowed) {
        clearPending();
        return;
      }
      schedule();
    },
  };
}
