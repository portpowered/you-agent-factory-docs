import { afterEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { DocsShellNavigationInput } from "../../src/lib/content";
import { RESPONSIVE_BREAKPOINTS_PX } from "../../src/lib/responsive-tokens";
import { enMessages } from "../../src/localization/messages/en";
import { mockMatchMedia } from "../helpers/mock-match-media";
import { renderWithLocalization } from "../helpers/render-with-localization";

const generatedNavigation: DocsShellNavigationInput = {
  sections: [
    {
      id: "guides",
      label: "Guides",
      pages: [
        {
          canonicalId: "doc/getting-started",
          label: "Getting started",
          href: "/docs/getting-started",
          order: 1,
        },
      ],
    },
  ],
};

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
  test("projects canonical viewport state onto docs and landing shells", async () => {
    mock.module("next/link", () => ({
      default: ({ href, children, ...props }: Record<string, unknown>) => (
        <a href={href as string} {...props}>
          {children as React.ReactNode}
        </a>
      ),
    }));

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.mobileMax });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");
    const { LandingShell } = await import(
      "../../src/components/landing/landing-shell"
    );

    const { container: docsContainer, unmount: unmountDocs } =
      renderWithLocalization(
        <DocsShell navigation={generatedNavigation}>
          <h1>{enMessages.docs.shellTitle}</h1>
        </DocsShell>,
      );
    const docsRoot = docsContainer.querySelector(".shared-shell");
    expect(docsRoot?.getAttribute("data-shell-viewport")).toBe("mobile");
    expect(docsRoot?.hasAttribute("data-shell-narrow")).toBe(true);
    unmountDocs();

    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { container: landingContainer } = renderWithLocalization(
      <LandingShell />,
    );
    const landingRoot = landingContainer.querySelector(".shared-shell");
    expect(landingRoot?.getAttribute("data-shell-viewport")).toBe("desktop");
    expect(landingRoot?.hasAttribute("data-shell-narrow")).toBe(false);
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
