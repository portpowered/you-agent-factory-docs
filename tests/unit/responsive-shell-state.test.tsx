import { afterEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { RESPONSIVE_BREAKPOINTS_PX } from "../../src/lib/responsive-tokens";
import { mockMatchMedia } from "../helpers/mock-match-media";
import { renderWithLocalization } from "../helpers/render-with-localization";

afterEach(() => {
  mock.restore();
});

describe("useResponsiveShellState", () => {
  test("exposes desktop, tablet, and mobile shell classifications", async () => {
    mock.module("next/link", () => ({
      default: ({ href, children, ...props }: Record<string, unknown>) => (
        <a href={href as string} {...props}>
          {children as React.ReactNode}
        </a>
      ),
    }));

    const { useResponsiveShellState } = await import(
      "../../src/hooks/layout/useResponsiveShellState"
    );

    function Probe() {
      const state = useResponsiveShellState();
      return (
        <output>
          {state.viewport}:{String(state.isNarrowViewport)}:
          {String(state.isHydrated)}
        </output>
      );
    }

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax });
    const { rerender } = render(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("tablet:true:true");

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.mobileMax });
    rerender(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("mobile:true:true");

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });
    rerender(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("desktop:false:true");
  });
});

describe("responsive shell integration", () => {
  test("projects canonical viewport state onto the shared landing shell", async () => {
    mock.module("next/link", () => ({
      default: ({ href, children, ...props }: Record<string, unknown>) => (
        <a href={href as string} {...props}>
          {children as React.ReactNode}
        </a>
      ),
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.mobileMax });
    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    const { container: landingContainer } = renderWithLocalization(
      <LandingShell />,
    );
    const landingRoot = landingContainer.querySelector(".shared-shell");
    expect(landingRoot?.getAttribute("data-shell-viewport")).toBe("mobile");
    expect(landingRoot?.hasAttribute("data-shell-narrow")).toBe(true);
  });

  test("projects narrow viewport state onto landing shell for tablet widths", async () => {
    mock.module("next/link", () => ({
      default: ({ href, children, ...props }: Record<string, unknown>) => (
        <a href={href as string} {...props}>
          {children as React.ReactNode}
        </a>
      ),
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax });

    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    const { container } = renderWithLocalization(<LandingShell />);
    const landingRoot = container.querySelector(".shared-shell");
    expect(landingRoot?.getAttribute("data-shell-viewport")).toBe("tablet");
    expect(landingRoot?.hasAttribute("data-shell-narrow")).toBe(true);
  });
});
