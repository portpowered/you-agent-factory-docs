import { afterEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { DocsShellNavigationInput } from "../../src/lib/content";
import {
  CALLOUT_SECTION_HEADING,
  CODE_BLOCK_SECTION_HEADING,
  CODE_PRESENTATION_EXAMPLE_INTRO,
  CODE_PRESENTATION_EXAMPLE_ROUTE,
  CODE_PRESENTATION_EXAMPLE_SECTION_LABEL,
  CODE_PRESENTATION_EXAMPLE_TITLE,
  CODE_TABS_SECTION_HEADING,
  DEFAULT_FILE_TREE_LABEL,
  DOCS_NAV_CODE_PRESENTATION_LABEL,
  EXAMPLE_FILE_TREE,
  FILE_TREE_SECTION_HEADING,
  withCodePresentationExampleNavigation,
} from "../../src/lib/docs-primitives";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import { GITHUB_REPO_URL } from "../../src/lib/shell";
import { enMessages } from "../../src/localization/messages/en";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";
import { renderWithLocalization } from "../helpers/render-with-localization";

mock.module("next/link", () => ({
  default: MockLink,
}));

afterEach(() => {
  mock.restore();
});

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
        {
          canonicalId: "doc/concepts",
          label: "Core concepts",
          href: "/docs/concepts",
          order: 2,
        },
      ],
    },
    {
      id: "setup",
      label: "Setup",
      pages: [
        {
          canonicalId: "doc/installation",
          label: "Installation",
          href: "/docs/installation",
          order: 1,
        },
        {
          canonicalId: "doc/configuration",
          label: "Configuration",
          href: "/docs/configuration",
          order: 2,
        },
      ],
    },
    {
      id: "use cases",
      label: "Use cases",
      pages: [
        {
          canonicalId: "doc/pr-review-factory",
          label: "PR Review Factory",
          href: "/docs/pr-review-factory",
          order: 3,
        },
        {
          canonicalId: "doc/release-readiness-factory",
          label: "Release Readiness Factory",
          href: "/docs/release-readiness-factory",
          order: 4,
        },
      ],
    },
  ],
};

const navigationWithCodePresentation =
  withCodePresentationExampleNavigation(generatedNavigation);

const { CodePresentationExample } = await import(
  "../../src/components/docs/code-presentation-example"
);

describe("docs shell rendering", () => {
  test("renders header, generated docs navigation, and main content landmarks", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell navigation={generatedNavigation}>
        <article aria-labelledby="docs-shell-title">
          <h1 id="docs-shell-title">{enMessages.docs.shellTitle}</h1>
          <p className="docs-shell__framing">{enMessages.docs.framingText}</p>
        </article>
      </DocsShell>,
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Guides" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: enMessages.docs.shellTitle,
      }),
    ).toBeTruthy();
    expect(screen.getByText(enMessages.docs.framingText)).toBeTruthy();
    expect(
      within(screen.getByRole("banner")).getByText(PROJECT_NAME),
    ).toBeTruthy();
    const guidesNav = screen.getByRole("navigation", { name: "Guides" });
    const setupNav = screen.getByRole("navigation", { name: "Setup" });
    const useCasesNav = screen.getByRole("navigation", { name: "Use cases" });
    expect(within(guidesNav).getByText("Guides")).toBeTruthy();
    expect(within(setupNav).getByText("Setup")).toBeTruthy();
    expect(within(useCasesNav).getByText("Use cases")).toBeTruthy();
    expect(within(guidesNav).getByText("Getting started")).toBeTruthy();
    expect(within(guidesNav).getByText("Core concepts")).toBeTruthy();
    expect(within(setupNav).getByText("Installation")).toBeTruthy();
    expect(within(setupNav).getByText("Configuration")).toBeTruthy();
    expect(within(useCasesNav).getByText("PR Review Factory")).toBeTruthy();
    expect(
      within(useCasesNav).getByText("Release Readiness Factory"),
    ).toBeTruthy();
  });

  test("renders separate navigation landmarks for each generated docs section", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell navigation={generatedNavigation}>
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    const guidesNav = screen.getByRole("navigation", { name: "Guides" });
    const setupNav = screen.getByRole("navigation", { name: "Setup" });
    const useCasesNav = screen.getByRole("navigation", { name: "Use cases" });

    expect(within(guidesNav).getAllByRole("link")).toHaveLength(2);
    expect(within(setupNav).getAllByRole("link")).toHaveLength(2);
    expect(within(useCasesNav).getAllByRole("link")).toHaveLength(2);
  });

  test("marks the active generated nav entry and links home and GitHub", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath="/docs/getting-started"
        navigation={navigationWithCodePresentation}
      >
        <h1>Getting started</h1>
      </DocsShell>,
    );

    const siteNav = screen.getByRole("navigation", {
      name: enMessages.landing.primaryNavAriaLabel,
    });
    const homeLink = within(siteNav).getByRole("link", {
      name: enMessages.common.home,
    });
    const githubLink = within(siteNav).getByRole("link", {
      name: `${enMessages.common.githubCta} (opens in new tab)`,
    });

    expect(homeLink.getAttribute("href")).toBe("/");
    expect(githubLink.getAttribute("href")).toBe(GITHUB_REPO_URL);

    const guidesNav = screen.getByRole("navigation", { name: "Guides" });
    const gettingStartedLink = within(guidesNav).getByRole("link", {
      name: "Getting started",
    });

    expect(gettingStartedLink.getAttribute("href")).toBe(
      "/docs/getting-started",
    );
    expect(gettingStartedLink.getAttribute("aria-current")).toBe("page");

    const examplesNav = screen.getByRole("navigation", {
      name: CODE_PRESENTATION_EXAMPLE_SECTION_LABEL,
    });
    const codePresentationLink = within(examplesNav).getByRole("link", {
      name: DOCS_NAV_CODE_PRESENTATION_LABEL,
    });

    expect(codePresentationLink.getAttribute("href")).toBe(
      CODE_PRESENTATION_EXAMPLE_ROUTE,
    );
    expect(codePresentationLink.getAttribute("aria-current")).toBeNull();
  });

  test("does not mark docs entry overview as active when viewing generated pages", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath={DOCS_ENTRY_ROUTE}
        navigation={generatedNavigation}
      >
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    const docsNav = screen.getByRole("navigation", { name: "Guides" });
    const gettingStartedLink = within(docsNav).getByRole("link", {
      name: "Getting started",
    });

    expect(gettingStartedLink.getAttribute("aria-current")).toBeNull();
  });

  test("renders breadcrumb position from generated navigation ancestry on detail pages", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath="/docs/getting-started"
        navigation={generatedNavigation}
      >
        <h1>Getting started</h1>
      </DocsShell>,
    );

    const breadcrumbs = screen.getByRole("navigation", {
      name: enMessages.docs.breadcrumbAriaLabel,
    });
    const breadcrumbItems = within(breadcrumbs).getAllByRole("listitem");

    expect(breadcrumbItems).toHaveLength(3);

    const [docsRootItem, sectionItem, currentPageItem] = breadcrumbItems;

    expect(docsRootItem).toBeTruthy();
    expect(sectionItem).toBeTruthy();
    expect(currentPageItem).toBeTruthy();

    if (!docsRootItem || !sectionItem || !currentPageItem) {
      throw new Error("Expected breadcrumb items to be present");
    }

    expect(
      within(docsRootItem)
        .getByRole("link", {
          name: enMessages.docs.shellTitle,
        })
        .getAttribute("href"),
    ).toBe(DOCS_ENTRY_ROUTE);
    expect(within(sectionItem).getByText("Guides")).toBeTruthy();
    expect(
      within(currentPageItem)
        .getByText("Getting started")
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  test("marks the docs entry route as the current breadcrumb page", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath={DOCS_ENTRY_ROUTE}
        navigation={generatedNavigation}
      >
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    const breadcrumbs = screen.getByRole("navigation", {
      name: enMessages.docs.breadcrumbAriaLabel,
    });
    const currentCrumb = within(breadcrumbs).getByText(
      enMessages.docs.shellTitle,
    );

    expect(currentCrumb.getAttribute("aria-current")).toBe("page");
    expect(within(breadcrumbs).queryByRole("link")).toBeNull();
  });

  test("renders generated previous-next progression across docs detail pages", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath="/docs/getting-started"
        navigation={generatedNavigation}
      >
        <h1>Getting started</h1>
      </DocsShell>,
    );

    const progression = screen.getByRole("navigation", {
      name: enMessages.docs.progressionAriaLabel,
    });

    expect(
      within(progression).queryByRole("link", {
        name: `${enMessages.docs.previousPagePrefix} Core concepts`,
      }),
    ).toBeNull();
    expect(
      within(progression)
        .getByRole("link", {
          name: `${enMessages.docs.nextPagePrefix} Core concepts`,
        })
        .getAttribute("href"),
    ).toBe("/docs/concepts");
  });

  test("renders previous progression when the current page is not first in sequence", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell currentPath="/docs/concepts" navigation={generatedNavigation}>
        <h1>Core concepts</h1>
      </DocsShell>,
    );

    const progression = screen.getByRole("navigation", {
      name: enMessages.docs.progressionAriaLabel,
    });

    expect(
      within(progression)
        .getByRole("link", {
          name: `${enMessages.docs.previousPagePrefix} Getting started`,
        })
        .getAttribute("href"),
    ).toBe("/docs/getting-started");
    expect(
      within(progression)
        .getByRole("link", {
          name: `${enMessages.docs.nextPagePrefix} Installation`,
        })
        .getAttribute("href"),
    ).toBe("/docs/installation");
  });

  test("renders generated use-case pages as standard docs-shell navigation links", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath="/docs/pr-review-factory"
        navigation={generatedNavigation}
      >
        <h1>PR Review Factory</h1>
      </DocsShell>,
    );

    const useCasesNav = screen.getByRole("navigation", { name: "Use cases" });
    const reviewLink = within(useCasesNav).getByRole("link", {
      name: "PR Review Factory",
    });
    const releaseLink = within(useCasesNav).getByRole("link", {
      name: "Release Readiness Factory",
    });

    expect(reviewLink.getAttribute("href")).toBe("/docs/pr-review-factory");
    expect(reviewLink.getAttribute("aria-current")).toBe("page");
    expect(releaseLink.getAttribute("href")).toBe(
      "/docs/release-readiness-factory",
    );
  });

  test("marks the code presentation example route as current when active", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath={CODE_PRESENTATION_EXAMPLE_ROUTE}
        navigation={navigationWithCodePresentation}
      >
        <p>Example content</p>
      </DocsShell>,
    );

    const examplesNav = screen.getByRole("navigation", {
      name: CODE_PRESENTATION_EXAMPLE_SECTION_LABEL,
    });
    const codePresentationLink = within(examplesNav).getByRole("link", {
      name: DOCS_NAV_CODE_PRESENTATION_LABEL,
    });

    expect(codePresentationLink.getAttribute("aria-current")).toBe("page");
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
    expect(screen.getAllByRole("note")).toHaveLength(3);
    expect(
      screen.getByRole("note", { name: "Information: Run locally first" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("note", {
        name: "Caution: Protect production credentials",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: DEFAULT_FILE_TREE_LABEL }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Folder: workflows")).toBeTruthy();
    expect(screen.getByLabelText("File: README.md")).toBeTruthy();
    expect(screen.getByText(EXAMPLE_FILE_TREE[0]?.name ?? "")).toBeTruthy();
    expect(
      screen.getByText(
        "base-workflow-with-a-very-long-filename-for-narrow-layouts.yaml",
      ),
    ).toBeTruthy();
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

describe("responsive docs navigation depth", () => {
  test("exposes multi-section generated docs navigation through shared disclosure on narrow viewports", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.mobileMax });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell navigation={generatedNavigation}>
        <h1>{enMessages.docs.shellTitle}</h1>
      </DocsShell>,
    );

    const toggle = screen.getByRole("button", {
      name: enMessages.shell.showDocsNavLabel,
    });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Guides" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Setup" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Use cases" })).toBeNull();

    fireEvent.click(toggle);

    const guidesNav = screen.getByRole("navigation", { name: "Guides" });
    const setupNav = screen.getByRole("navigation", { name: "Setup" });
    const useCasesNav = screen.getByRole("navigation", { name: "Use cases" });

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(within(guidesNav).getAllByRole("link")).toHaveLength(2);
    expect(within(setupNav).getAllByRole("link")).toHaveLength(2);
    expect(within(useCasesNav).getAllByRole("link")).toHaveLength(2);
  });

  test("keeps breadcrumbs and progression reachable in main content on narrow viewports without docs sidebar disclosure", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    renderWithLocalization(
      <DocsShell
        currentPath="/docs/getting-started"
        navigation={generatedNavigation}
      >
        <h1>Getting started</h1>
      </DocsShell>,
    );

    const breadcrumbs = screen.getByRole("navigation", {
      name: enMessages.docs.breadcrumbAriaLabel,
    });
    const progression = screen.getByRole("navigation", {
      name: enMessages.docs.progressionAriaLabel,
    });

    expect(within(breadcrumbs).getByText("Guides")).toBeTruthy();
    expect(
      within(progression)
        .getByRole("link", {
          name: `${enMessages.docs.nextPagePrefix} Core concepts`,
        })
        .getAttribute("href"),
    ).toBe("/docs/concepts");
    expect(screen.queryByRole("navigation", { name: "Guides" })).toBeNull();
  });

  test("keeps responsive disclosure state separate from projected navigation depth", async () => {
    mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.mobileMax });

    const { DocsShell } = await import("../../src/components/docs/docs-shell");

    const { rerender } = renderWithLocalization(
      <DocsShell
        currentPath="/docs/getting-started"
        navigation={generatedNavigation}
      >
        <h1>Getting started</h1>
      </DocsShell>,
    );

    const toggle = screen.getByRole("button", {
      name: enMessages.shell.showDocsNavLabel,
    });
    fireEvent.click(toggle);
    expect(screen.getByRole("navigation", { name: "Guides" })).toBeTruthy();

    const alternateNavigation: DocsShellNavigationInput = {
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
            {
              canonicalId: "doc/concepts",
              label: "Renamed concepts page",
              href: "/docs/concepts",
              order: 2,
            },
          ],
        },
      ],
    };

    rerender(
      <DocsShell
        currentPath="/docs/getting-started"
        navigation={alternateNavigation}
      >
        <h1>Getting started</h1>
      </DocsShell>,
    );

    const guidesNav = screen.getByRole("navigation", { name: "Guides" });
    expect(
      within(guidesNav).getByRole("link", { name: "Renamed concepts page" }),
    ).toBeTruthy();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });
});
