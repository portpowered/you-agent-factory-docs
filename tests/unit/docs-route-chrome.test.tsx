import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, screen, within } from "@testing-library/react";
import type {
  DocsShellNavigationInput,
  PublicSearchArtifact,
} from "../../src/lib/content";
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
    {
      id: "doc/installation@fr",
      canonicalId: "doc/installation",
      locale: "fr",
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
      kind: "doc",
      url: "/docs/installation",
      title: "Installation FR",
      description: "Installez la factory sur votre machine.",
      headings: ["Installation"],
      body: "Installez la factory localement.",
      tags: ["installation"],
      aliases: ["guide d'installation"],
      section: "Configuration",
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
          canonicalId: "doc/introduction",
          href: "/docs/introduction",
          label: "Introduction",
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

describe("docs route chrome", () => {
  test("keeps generated navigation affordances and localized labels on the Fumadocs-owned route path", async () => {
    renderDocsRoute(
      {
        currentPath: "/docs/installation",
        navigation: generatedNavigation,
        children: (
          <article>
            <h1>Installation</h1>
          </article>
        ),
      },
      { locale: "fr" },
    );

    expect(
      screen.getByRole("region", {
        name: "Rechercher dans la documentation",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", {
        name: "Fil d'Ariane",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", {
        name: "Progression de page",
      }),
    ).toBeTruthy();
    expect(
      await screen.findByText(
        "Saisissez une requete pour rechercher dans la documentation publiee de la langue active.",
      ),
    ).toBeTruthy();
    const docsNav = screen.getByRole("navigation", {
      name: "Navigation de la documentation",
    });
    expect(within(docsNav).getByText("Setup")).toBeTruthy();
    expect(within(docsNav).getByText("Getting started")).toBeTruthy();
  });

  test("uses the active locale for the preserved docs search entry behavior", async () => {
    renderDocsRoute(
      {
        navigation: generatedNavigation,
        children: <h1>Documentation</h1>,
      },
      { locale: "fr" },
    );

    const searchInput = screen.getByRole("searchbox", {
      name: "Rechercher dans la documentation",
    });

    fireEvent.change(searchInput, { target: { value: "install" } });

    const resultLink = await screen.findByRole("link", {
      name: /Installation FR Installez la factory sur votre machine\./,
    });

    expect(resultLink.getAttribute("href")).toBe("/docs/installation");
    expect(screen.getByText("1 documentation correspondante")).toBeTruthy();
  });
});
