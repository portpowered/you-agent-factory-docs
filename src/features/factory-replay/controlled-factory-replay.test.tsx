import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ControlledFactoryReplay } from "./controlled-factory-replay";
import { DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES } from "./default-messages";
import { FIXTURE_RECORDING_A } from "./fixtures";

afterEach(() => {
  cleanup();
});

describe("ControlledFactoryReplay public entry", () => {
  test("full mode renders scrubber, topology, and Work progress for one injected recording", () => {
    render(
      <ControlledFactoryReplay
        bindDomGates={false}
        mode="full"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-factory-replay-mode")).toBe("full");
    expect(root.getAttribute("data-selected-tick")).toBe("2");

    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeTruthy();
  });

  test("compact mode renders topology + tick/position + Play/Pause without Work progress", () => {
    render(
      <ControlledFactoryReplay
        bindDomGates={false}
        mode="compact"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-factory-replay-mode")).toBe("compact");
    expect(root.getAttribute("data-progress-visible")).toBe("false");
    expect(root.getAttribute("data-selected-tick")).toBe("2");

    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Selected tick 2")).toBeTruthy();
    expect(screen.getByText("Tick 2 of 2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();

    expect(
      screen.queryByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.timeline.regionLabel,
      }),
    ).toBeNull();
  });

  test("same recording: Work progress present in full, absent in compact via public mode prop", () => {
    const { unmount: unmountFull } = render(
      <ControlledFactoryReplay
        bindDomGates={false}
        mode="full"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeTruthy();
    unmountFull();

    render(
      <ControlledFactoryReplay
        bindDomGates={false}
        mode="compact"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    expect(
      screen.queryByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.progress.regionLabel,
      }),
    ).toBeNull();
    expect(
      screen.getByRole("region", {
        name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.topology.regionLabel,
      }),
    ).toBeTruthy();
  });

  test("Play/Pause through the public entry updates host-owned playing state", () => {
    render(
      <ControlledFactoryReplay
        bindDomGates={false}
        mode="full"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.getAttribute("data-playing")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(root.getAttribute("data-playing")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(root.getAttribute("data-playing")).toBe("false");
  });

  test("does not mount FactoryRecordingTopologyReplay ownership chrome", () => {
    render(
      <ControlledFactoryReplay
        bindDomGates={false}
        mode="full"
        recording={FIXTURE_RECORDING_A}
      />,
    );

    const root = screen.getByRole("region", {
      name: DEFAULT_CONTROLLED_FACTORY_REPLAY_MESSAGES.chrome.regionLabel,
    });
    expect(root.className.includes("factory-recording-topology-replay")).toBe(
      false,
    );
    expect(root.getAttribute("data-factory-replay-mode")).toBe("full");
  });
});
