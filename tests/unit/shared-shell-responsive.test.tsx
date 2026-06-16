import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  sharedShellConfig,
} from "../../src/lib/shared-shell-config";
import MockLink from "../helpers/mock-next-link";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { useSharedShellNavigationDisclosure } = await import(
  "../../src/hooks/use-shared-shell-navigation-disclosure"
);
const { SharedShellHeader } = await import(
  "../../src/components/shell/shared-shell-header"
);
const { SharedShell } = await import("../../src/components/shell/shared-shell");

function DisclosureProbe({
  initialOpen = false,
}: {
  initialOpen?: boolean;
}) {
  const disclosure = useSharedShellNavigationDisclosure(initialOpen);

  return (
    <div>
      <p data-testid="open-state">{disclosure.isOpen ? "open" : "closed"}</p>
      <button onClick={disclosure.open} type="button">
        open
      </button>
      <button onClick={disclosure.close} type="button">
        close
      </button>
      <button onClick={disclosure.toggle} type="button">
        toggle
      </button>
    </div>
  );
}

describe("shared shell navigation disclosure hook", () => {
  test("starts closed for SSR-safe initial render and toggles projected open state", () => {
    render(<DisclosureProbe />);

    expect(screen.getByTestId("open-state").textContent).toBe("closed");

    fireEvent.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByTestId("open-state").textContent).toBe("open");

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(screen.getByTestId("open-state").textContent).toBe("closed");

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("open-state").textContent).toBe("open");
  });
});

describe("shared shell responsive header", () => {
  test("renders a menu toggle wired to primary navigation disclosure state", () => {
    render(<SharedShellHeader config={sharedShellConfig} surface="home" />);

    const menuToggle = screen.getByRole("button", { name: "Open menu" });
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });

    expect(menuToggle.getAttribute("aria-controls")).toBe(
      "shared-shell-primary-nav",
    );
    expect(menuToggle.getAttribute("aria-expanded")).toBe("false");
    expect(primaryNav.getAttribute("id")).toBe("shared-shell-primary-nav");
    expect(primaryNav.className).not.toContain(
      "shared-shell__header-nav--open",
    );

    fireEvent.click(menuToggle);

    expect(
      screen
        .getByRole("button", { name: "Close menu" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(primaryNav.className).toContain("shared-shell__header-nav--open");
  });

  test("keeps primary navigation links keyboard reachable when disclosure is open", () => {
    render(<SharedShellHeader config={sharedShellConfig} surface="home" />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    const links = within(primaryNav).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      DOCS_CTA_LABEL,
      GITHUB_CTA_LABEL,
    ]);

    for (const link of links) {
      link.focus();
      expect(document.activeElement).toBe(link);
    }
  });

  test("derives disclosure labels from sharedShellConfig rather than local constants", () => {
    const customConfig = {
      ...sharedShellConfig,
      responsive: {
        ...sharedShellConfig.responsive,
        navigationDisclosure: {
          openLabel: "Show navigation",
          closeLabel: "Hide navigation",
        },
      },
    };

    render(<SharedShellHeader config={customConfig} surface="docs" />);

    expect(
      screen.getByRole("button", { name: "Show navigation" }),
    ).toBeTruthy();
  });
});

describe("shared shell responsive layout contract", () => {
  test("uses the same responsive header on homepage and docs surfaces", () => {
    const { rerender } = render(
      <SharedShell surface="home">
        <p>Home</p>
      </SharedShell>,
    );

    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Primary" }).getAttribute("id"),
    ).toBe("shared-shell-primary-nav");

    rerender(
      <SharedShell surface="docs">
        <p>Docs</p>
      </SharedShell>,
    );

    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Primary" }).getAttribute("id"),
    ).toBe("shared-shell-primary-nav");
  });
});
