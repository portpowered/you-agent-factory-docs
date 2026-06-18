import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, screen, within } from "@testing-library/react";
import type {
  DocsShellNavigationInput,
  PublicSearchArtifact,
} from "../../src/lib/content";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "../../src/lib/project";
import { enMessages } from "../../src/localization/messages/en";
import { MockFumadocsDocsLayout } from "../helpers/mock-fumadocs-docs-layout";
import {
  RESPONSIVE_BREAKPOINTS_PX,
  mockMatchMedia,
} from "../helpers/mock-match-media";
import MockLink from "../helpers/mock-next-link";
import { renderDocsRoute } from "../helpers/render-docs-route";

mock.module("next/link", () => ({
  default: MockLink,
}));
mock.module("fumadocs-ui/layouts/docs", () => ({
  DocsLayout: MockFumadocsDocsLayout,
}));

const publicSearchArtifact: PublicSearchArtifact = {
  version: 1,
  entries: [
    {
      id: "doc/installation@en",
      canonicalId: "doc/installation",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      kind: "doc",
      url: "/docs/installation",
      title: "Installation",
      description: "Install the factory on your machine.",
      headings: ["Install"],
      body: "Install the factory locally.",
      tags: ["setup"],
      aliases: ["install guide"],
      section: "Setup",
      searchPriority: 20,
    },
  ],
};

const generatedNavigation: DocsShellNavigationInput = {
  sections: [
    {
      id: "setup",
      label: "Setup",
      pages: [
        {
          canonicalId: "overview",
          href: DOCS_ENTRY_ROUTE,
          label: enMessages.docs.navOverview,
          order: 0,
        },
        {
          canonicalId: "doc/installation",
          href: "/docs/installation",
          label: "Installation",
          order: 1,
        },
      ],
    },
    {
      id: "guides",
      label: "Guides",
      pages: [
        {
          canonicalId: "doc/getting-started",
          href: "/docs/getting-started",
          label: "Getting started",
          order: 0,
        },
        {
          canonicalId: "doc/concepts",
          href: "/docs/concepts",
          label: "Core concepts",
          order: 1,
        },
        {
          canonicalId: "doc/faq",
          href: "/docs/faq",
          label: "FAQ",
          order: 2,
        },
      ],
    },
  ],
};

beforeEach(() => {
  mockMatchMedia({ width: RESPONSIVE_BREAKPOINTS_PX.tabletMax + 1 });
  globalThis.fetch = mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(publicSearchArtifact), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    ),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  mock.restore();
});

describe("docs route shell rendering", () => {
  test("renders the Fumadocs-owned docs route frame with projected navigation and route chrome", () => {
    renderDocsRoute({
      navigation: generatedNavigation,
      children: (
        <article aria-labelledby="docs-shell-title">
          <h1 id="docs-shell-title">{enMessages.docs.shellTitle}</h1>
          <p>{enMessages.docs.framingText}</p>
        </article>
      ),
    });

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(
      within(screen.getByRole("banner")).getByRole("link", {
        name: PROJECT_NAME,
      }),
    ).toBeTruthy();
    const docsNav = screen.getByRole("navigation", {
      name: enMessages.docs.navHeading,
    });
    expect(within(docsNav).getByText("Setup")).toBeTruthy();
    expect(within(docsNav).getByText("Guides")).toBeTruthy();
    expect(
      within(docsNav).getByRole("link", { name: "Installation" }),
    ).toBeTruthy();
    expect(within(docsNav).getByRole("link", { name: "FAQ" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(
      screen.getByRole("region", { name: enMessages.docs.searchTitle }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", {
        name: enMessages.docs.breadcrumbAriaLabel,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", {
        name: enMessages.docs.progressionAriaLabel,
      }),
    ).toBeTruthy();
  });

  test("keeps FAQ inside the generated guides journey on the live docs route seam", () => {
    renderDocsRoute({
      currentPath: "/docs/faq",
      navigation: generatedNavigation,
      children: <h1>FAQ</h1>,
    });

    const docsNav = screen.getByRole("navigation", {
      name: enMessages.docs.navHeading,
    });
    const faqLink = within(docsNav).getByRole("link", { name: "FAQ" });
    expect(faqLink.getAttribute("href")).toBe("/docs/faq");

    const breadcrumbs = screen.getByRole("navigation", {
      name: enMessages.docs.breadcrumbAriaLabel,
    });
    expect(within(breadcrumbs).getByText("Guides")).toBeTruthy();
    expect(
      within(breadcrumbs).getByText("FAQ").getAttribute("aria-current"),
    ).toBe("page");

    const progression = screen.getByRole("navigation", {
      name: enMessages.docs.progressionAriaLabel,
    });
    expect(
      within(progression)
        .getByRole("link", {
          name: `${enMessages.docs.previousPagePrefix} Core concepts`,
        })
        .getAttribute("href"),
    ).toBe("/docs/concepts");
  });

  test("returns Orama-backed search results on the live docs route seam", async () => {
    renderDocsRoute({
      navigation: generatedNavigation,
      children: <h1>{enMessages.docs.shellTitle}</h1>,
    });

    const searchInput = screen.getByRole("searchbox", {
      name: "Search documentation",
    });
    fireEvent.change(searchInput, { target: { value: "install" } });

    const resultLink = await screen.findByRole("link", {
      name: /Installation Install the factory on your machine\./,
    });

    expect(resultLink.getAttribute("href")).toBe("/docs/installation");
    expect(screen.getByText("1 matching docs")).toBeTruthy();
  });

  test("returns to idle search guidance when the query is cleared", async () => {
    renderDocsRoute({
      navigation: generatedNavigation,
      children: <h1>{enMessages.docs.shellTitle}</h1>,
    });

    const searchInput = screen.getByRole("searchbox", {
      name: "Search documentation",
    });
    fireEvent.change(searchInput, { target: { value: "install" } });

    await screen.findByText("1 matching docs");
    fireEvent.change(searchInput, { target: { value: "" } });

    expect(
      await screen.findByText(
        "Type a query to search the current locale's published docs.",
      ),
    ).toBeTruthy();
  });

  test("shows the empty state on the live docs route seam when no docs match", async () => {
    renderDocsRoute({
      navigation: generatedNavigation,
      children: <h1>{enMessages.docs.shellTitle}</h1>,
    });

    const searchInput = screen.getByRole("searchbox", {
      name: "Search documentation",
    });
    fireEvent.change(searchInput, { target: { value: "unknown" } });

    expect(
      await screen.findByText("No matching docs found for this query."),
    ).toBeTruthy();
  });
});
