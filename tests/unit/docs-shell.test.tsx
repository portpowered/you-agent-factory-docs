import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  CALLOUT_SECTION_HEADING,
  CODE_BLOCK_SECTION_HEADING,
  CODE_PRESENTATION_EXAMPLE_INTRO,
  CODE_PRESENTATION_EXAMPLE_ROUTE,
  CODE_PRESENTATION_EXAMPLE_TITLE,
  CODE_TABS_SECTION_HEADING,
  DOCS_NAV_CODE_PRESENTATION_LABEL,
  EXAMPLE_FILE_TREE,
  FILE_TREE_SECTION_HEADING,
} from "../../src/lib/docs-primitives";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import {
  DOCS_NAV_HEADING,
  DOCS_NAV_OVERVIEW_LABEL,
  DOCS_SHELL_FRAMING_TEXT,
  DOCS_SHELL_TITLE,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
} from "../../src/lib/shell";
import MockLink from "../helpers/mock-next-link";

mock.module("next/link", () => ({
  default: MockLink,
}));

const { DocsShell } = await import("../../src/components/docs/docs-shell");
const { CodePresentationExample } = await import(
  "../../src/components/docs/code-presentation-example"
);
const { DocsShellLayout } = await import(
  "../../src/components/docs/docs-shell-layout"
);

describe("docs shell rendering", () => {
  test("renders header, docs navigation, and main content landmarks", () => {
    render(<DocsShell />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: DOCS_NAV_HEADING }),
    ).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();

    expect(
      screen.getByRole("heading", { level: 1, name: DOCS_SHELL_TITLE }),
    ).toBeTruthy();
    expect(screen.getByText(DOCS_SHELL_FRAMING_TEXT)).toBeTruthy();
    expect(screen.getByText(PROJECT_NAME)).toBeTruthy();
  });

  test("marks the overview entry as current and links home and GitHub", () => {
    render(<DocsShell />);

    const siteNav = screen.getByRole("navigation", { name: "Site" });
    const homeLink = within(siteNav).getByRole("link", {
      name: HOME_CTA_LABEL,
    });
    const githubLink = within(siteNav).getByRole("link", {
      name: GITHUB_CTA_LABEL,
    });

    expect(homeLink.getAttribute("href")).toBe("/");
    expect(githubLink.getAttribute("href")).toBe(GITHUB_REPO_URL);

    const docsNav = screen.getByRole("navigation", { name: DOCS_NAV_HEADING });
    const overviewLink = within(docsNav).getByRole("link", {
      name: DOCS_NAV_OVERVIEW_LABEL,
    });
    const codePresentationLink = within(docsNav).getByRole("link", {
      name: DOCS_NAV_CODE_PRESENTATION_LABEL,
    });

    expect(overviewLink.getAttribute("href")).toBe(DOCS_ENTRY_ROUTE);
    expect(overviewLink.getAttribute("aria-current")).toBe("page");
    expect(codePresentationLink.getAttribute("href")).toBe(
      CODE_PRESENTATION_EXAMPLE_ROUTE,
    );
    expect(codePresentationLink.getAttribute("aria-current")).toBeNull();
  });
});

describe("code presentation example surface", () => {
  test("renders all four primitive categories with identifiable section headings", () => {
    render(<CodePresentationExample />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: CODE_PRESENTATION_EXAMPLE_TITLE,
      }),
    ).toBeTruthy();
    expect(screen.getByText(CODE_PRESENTATION_EXAMPLE_INTRO)).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: CODE_BLOCK_SECTION_HEADING,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: CODE_TABS_SECTION_HEADING,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: CALLOUT_SECTION_HEADING }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: FILE_TREE_SECTION_HEADING,
      }),
    ).toBeTruthy();
  });

  test("exposes accessible labels for code block, tabs, callouts, and file tree", () => {
    render(<CodePresentationExample />);

    const codeBlockSection = screen.getByRole("region", {
      name: CODE_BLOCK_SECTION_HEADING,
    });
    expect(
      within(codeBlockSection).getByRole("figure", { name: "Bash" }),
    ).toBeTruthy();
    expect(
      within(codeBlockSection).getByRole("figure", {
        name: "Long command line",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getAllByRole("note")).toHaveLength(2);
    expect(
      screen.getByRole("navigation", { name: "Example file tree" }),
    ).toBeTruthy();
    expect(screen.getByText(EXAMPLE_FILE_TREE[0]?.name ?? "")).toBeTruthy();
  });

  test("switches visible code tab panels through direct interaction", () => {
    render(<CodePresentationExample />);

    const powershellTab = screen.getByRole("tab", { name: "PowerShell" });
    const bashTab = screen.getByRole("tab", { name: "Bash" });

    expect(bashTab.getAttribute("aria-selected")).toBe("true");
    expect(powershellTab.getAttribute("aria-selected")).toBe("false");

    fireEvent.click(powershellTab);

    expect(powershellTab.getAttribute("aria-selected")).toBe("true");
    expect(bashTab.getAttribute("aria-selected")).toBe("false");

    const powershellPanel = screen.getByRole("tabpanel", {
      name: "PowerShell",
    });
    expect(
      within(powershellPanel).getByRole("figure", { name: "PowerShell" }),
    ).toBeTruthy();
  });

  test("switches code tabs on the example surface with keyboard controls", () => {
    render(<CodePresentationExample />);

    const bashTab = screen.getByRole("tab", { name: "Bash" });
    bashTab.focus();

    fireEvent.keyDown(bashTab, { key: "ArrowRight" });

    const powershellTab = screen.getByRole("tab", { name: "PowerShell" });
    expect(powershellTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(powershellTab);
  });
});

describe("docs shell layout navigation", () => {
  test("marks the code presentation route as current when active", () => {
    render(
      <DocsShellLayout activeNav="code-presentation">
        <p>Example content</p>
      </DocsShellLayout>,
    );

    const docsNav = screen.getByRole("navigation", { name: DOCS_NAV_HEADING });
    const overviewLink = within(docsNav).getByRole("link", {
      name: DOCS_NAV_OVERVIEW_LABEL,
    });
    const codePresentationLink = within(docsNav).getByRole("link", {
      name: DOCS_NAV_CODE_PRESENTATION_LABEL,
    });

    expect(overviewLink.getAttribute("aria-current")).toBeNull();
    expect(codePresentationLink.getAttribute("aria-current")).toBe("page");
  });
});
