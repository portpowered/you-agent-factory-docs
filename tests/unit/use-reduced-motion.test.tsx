import { afterEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";

afterEach(() => {
  mock.restore();
});

describe("useReducedMotion", () => {
  test("returns false when reduced motion is not preferred", async () => {
    const { useReducedMotion } = await import(
      "../../src/hooks/media/useReducedMotion"
    );

    function Probe() {
      const prefersReducedMotion = useReducedMotion();
      return <output>{String(prefersReducedMotion)}</output>;
    }

    mockMatchMedia({
      width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1,
      prefersReducedMotion: false,
    });

    render(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("false");
  });

  test("returns true when reduced motion is preferred", async () => {
    const { useReducedMotion } = await import(
      "../../src/hooks/media/useReducedMotion"
    );

    function Probe() {
      const prefersReducedMotion = useReducedMotion();
      return <output>{String(prefersReducedMotion)}</output>;
    }

    mockMatchMedia({
      width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1,
      prefersReducedMotion: true,
    });

    render(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("true");
  });

  test("tracks prefers-reduced-motion media query changes on the client", async () => {
    const { useReducedMotion } = await import(
      "../../src/hooks/media/useReducedMotion"
    );

    function Probe() {
      const prefersReducedMotion = useReducedMotion();
      return <output>{String(prefersReducedMotion)}</output>;
    }

    mockMatchMedia({
      width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1,
      prefersReducedMotion: false,
    });

    const { rerender } = render(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("false");

    mockMatchMedia({
      width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1,
      prefersReducedMotion: true,
    });
    rerender(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("true");
  });
});

describe("reduced-motion shell integration", () => {
  test("exposes prefersReducedMotion from useResponsiveShellState", async () => {
    const { useResponsiveShellState } = await import(
      "../../src/hooks/layout/useResponsiveShellState"
    );

    function Probe() {
      const state = useResponsiveShellState();
      return <output>{String(state.prefersReducedMotion)}</output>;
    }

    mockMatchMedia({
      width: RESPONSIVE_BREAKPOINTS_PX.tabletMax,
      prefersReducedMotion: true,
    });

    render(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("true");
  });
});
