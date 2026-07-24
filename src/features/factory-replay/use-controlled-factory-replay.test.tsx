/**
 * Hook IO lifecycle fixtures — prove autoplay survives Strict Mode
 * cleanup→remount (dispose must not permanently kill scheduler/gates).
 */

import { afterEach, describe, expect, test } from "bun:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { StrictMode } from "react";
import {
  AUTOPLAY_INTERVAL_MS,
  type AutoplaySchedulerTimers,
  type AutoplayTimerHandle,
} from "./autoplay-scheduler";
import { FIXTURE_RECORDING_A } from "./fixtures";
import { useControlledFactoryReplay } from "./use-controlled-factory-replay";

afterEach(() => {
  cleanup();
});

type PendingTimeout = {
  readonly callback: () => void;
  readonly delayMs: number;
  readonly id: number;
};

function createFakeTimers(): AutoplaySchedulerTimers & {
  advance(ms: number): void;
  pendingCount(): number;
} {
  let nextId = 1;
  let now = 0;
  const pending = new Map<number, PendingTimeout & { dueAt: number }>();

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

function HookHarness({
  timers,
}: {
  readonly timers?: AutoplaySchedulerTimers;
}) {
  const { dispatch, playback, rootRef } = useControlledFactoryReplay({
    bindDomGates: false,
    recording: FIXTURE_RECORDING_A,
    timers,
  });

  return (
    <div
      ref={rootRef}
      data-playing={String(playback.playing)}
      data-selected-tick={String(playback.selectedTick)}
      data-testid="factory-replay-hook-harness"
    >
      <button type="button" onClick={dispatch.play}>
        Play
      </button>
      <button type="button" onClick={dispatch.pause}>
        Pause
      </button>
    </div>
  );
}

describe("useControlledFactoryReplay IO lifecycle", () => {
  test("autoplay still schedules and advances after Strict Mode cleanup+remount", () => {
    const clock = createFakeTimers();

    render(
      <StrictMode>
        <HookHarness timers={clock} />
      </StrictMode>,
    );

    const harness = screen.getByTestId("factory-replay-hook-harness");
    expect(harness.getAttribute("data-selected-tick")).toBe("2");
    expect(harness.getAttribute("data-playing")).toBe("false");
    expect(clock.pendingCount()).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(harness.getAttribute("data-playing")).toBe("true");
    // Fresh scheduler after Strict Mode remount must accept sync and schedule.
    expect(clock.pendingCount()).toBe(1);

    act(() => {
      clock.advance(AUTOPLAY_INTERVAL_MS);
    });
    // Latest (2) → Advance wrap to earliest (1).
    expect(harness.getAttribute("data-selected-tick")).toBe("1");
    expect(clock.pendingCount()).toBe(1);

    act(() => {
      clock.advance(AUTOPLAY_INTERVAL_MS);
    });
    expect(harness.getAttribute("data-selected-tick")).toBe("2");
  });

  test("explicit unmount clears pending autoplay timeout", () => {
    const clock = createFakeTimers();
    const view = render(<HookHarness timers={clock} />);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(clock.pendingCount()).toBe(1);

    view.unmount();
    expect(clock.pendingCount()).toBe(0);
  });
});
