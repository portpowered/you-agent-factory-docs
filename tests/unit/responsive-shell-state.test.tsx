import { afterEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { RESPONSIVE_BREAKPOINTS_PX } from "../../src/lib/responsive-tokens";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
}

function mockMatchMediaForWidth(width: number) {
  window.matchMedia = (query: string) => {
    const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
    const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);

    let matches = false;

    if (maxWidthMatch) {
      matches = width <= Number(maxWidthMatch[1]);
    } else if (minWidthMatch) {
      matches = width >= Number(minWidthMatch[1]);
    }

    return {
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches,
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    } as MediaQueryList;
  };
}

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

    setViewportWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax);
    mockMatchMediaForWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax);
    const { rerender } = render(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("tablet:true:true");

    setViewportWidth(RESPONSIVE_BREAKPOINTS_PX.mobileMax);
    mockMatchMediaForWidth(RESPONSIVE_BREAKPOINTS_PX.mobileMax);
    rerender(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("mobile:true:true");

    setViewportWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1);
    mockMatchMediaForWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1);
    rerender(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("desktop:false:true");
  });
});

describe("responsive shell integration", () => {
  test("projects canonical viewport state onto docs and landing shells", async () => {
    mock.module("next/link", () => ({
      default: ({ href, children, ...props }: Record<string, unknown>) => (
        <a href={href as string} {...props}>
          {children as React.ReactNode}
        </a>
      ),
    }));

    setViewportWidth(RESPONSIVE_BREAKPOINTS_PX.mobileMax);
    mockMatchMediaForWidth(RESPONSIVE_BREAKPOINTS_PX.mobileMax);

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    const { container: docsContainer, unmount: unmountDocs } = render(
      <DocsShell />,
    );
    const docsRoot = docsContainer.querySelector(".docs-shell");
    expect(docsRoot?.getAttribute("data-shell-viewport")).toBe("mobile");
    expect(docsRoot?.hasAttribute("data-shell-narrow")).toBe(true);
    unmountDocs();

    setViewportWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1);
    mockMatchMediaForWidth(RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1);

    const { container: landingContainer } = render(<LandingShell />);
    const landingRoot = landingContainer.querySelector(".landing-shell");
    expect(landingRoot?.getAttribute("data-shell-viewport")).toBe("desktop");
    expect(landingRoot?.hasAttribute("data-shell-narrow")).toBe(false);
  });
});
