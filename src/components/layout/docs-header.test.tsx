import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SharedProps } from "fumadocs-ui/contexts/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ComponentType, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DOCS_HEADER_ACTIONS_COLUMN_CLASS,
  DOCS_HEADER_BRAND_LINK_CLASS,
  DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS,
  DOCS_HEADER_SHELL_CLASS,
  DocsHeader,
} from "@/components/layout/docs-header";
import {
  getPrimaryNavItems,
  PRIMARY_NAV_DESKTOP_CLASS,
  PRIMARY_NAV_LINK_CLASS,
  PRIMARY_NAV_MOBILE_LINK_CLASS,
  PRIMARY_NAV_MOBILE_MENU_BUTTON_CLASS,
} from "@/components/layout/primary-nav";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  CONTENT_COLUMN_CLASS,
  CONTENT_COLUMN_INSET_CLASS,
  CONTENT_COLUMN_INSET_FROM_MD_CLASS,
  usesNegativeMarginCompensation,
} from "@/lib/layout/content-column-alignment";
import type { SiteConfig } from "@/lib/site/site-config.contract";
import { resolveSiteConfigLayoutNav } from "@/lib/site/site-config-layout-nav";
import {
  YOU_AGENT_FACTORY_REPOSITORY_URL,
  youAgentFactorySiteConfig,
} from "@/lib/site/you-agent-factory-site-config";
import { source } from "@/lib/source";
import {
  resetMockNavigation,
  setMockPathname,
  setMockSearchParams,
} from "@/tests/a11y/mock-navigation";
import { NextNavigationTestProvider } from "@/tests/a11y/next-navigation-test-provider";
import { renderWithAppProviders } from "@/tests/a11y/render";

/** Local assertion: primary nav must not duplicate the header search control. */
function assertPrimaryNavNoDuplicateSearchLink(html: string): string | null {
  const match = html.match(
    /<nav\b[^>]*\baria-label="Primary"[^>]*>([\s\S]*?)<\/nav>/i,
  );
  if (!match?.[1]) {
    return 'primary navigation not found (aria-label="Primary")';
  }
  if (match[1].includes('href="/search"')) {
    return "primary navigation still exposes redundant /search link alongside header search";
  }
  return null;
}

const alternateSiteConfig = {
  brand: {
    scaffoldId: "example-scaffold",
    brandName: "Example Docs",
    siteHeading: "Example Reference",
  },
  repositoryUrl: "https://github.com/example/example",
  routeSurfaces: {
    home: { surface: "home" },
    guides: { surface: "docs-page", slug: "guides" },
    docs: { surface: "browse" },
    blogIndex: { surface: "blog-index" },
    search: { surface: "search" },
  },
  primaryNav: [
    { routeSurface: "home", labelKey: "home" },
    { routeSurface: "guides", labelKey: "guides" },
    { routeSurface: "docs", labelKey: "docs" },
    { routeSurface: "blogIndex", labelKey: "blog" },
  ],
  collections: [
    { family: "guides" },
    { family: "concepts" },
    { family: "techniques" },
    { family: "documentation" },
  ],
  homeFeaturedLinks: [] as SiteConfig["homeFeaturedLinks"],
} satisfies SiteConfig;

function renderHeaderWithNavigation(
  ui: ReactNode,
  {
    SearchDialog,
    pathname = "/",
    searchParams = new URLSearchParams(),
  }: {
    SearchDialog: ComponentType<SharedProps>;
    pathname?: string;
    searchParams?: URLSearchParams;
  },
) {
  setMockPathname(pathname);
  setMockSearchParams(searchParams);

  return render(
    <NextNavigationTestProvider pathname={pathname} searchParams={searchParams}>
      <RootProvider search={{ SearchDialog, enabled: true }}>{ui}</RootProvider>
    </NextNavigationTestProvider>,
  );
}

/** Product-order CLI primary destinations locked for the you-agent-factory shell. */
const CLI_PRIMARY_NAV_LABELS = [
  "Blog",
  "Docs",
  "Guides",
  "References",
] as const;
const CLI_PRIMARY_NAV_HREFS = [
  "/blog",
  "/browse",
  "/docs/guides",
  "/docs/references",
] as const;

describe("DocsHeader", () => {
  afterEach(() => {
    cleanup();
    resetMockNavigation();
  });

  test("locks CLI shell header brand, primary nav, and Search together", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const brand = resolveSiteConfigLayoutNav(youAgentFactorySiteConfig);
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader
          messages={messages}
          pageTree={source.pageTree}
          siteConfig={youAgentFactorySiteConfig}
        />
      </RootProvider>,
    );

    expect(brand.title).toBe("YOU");
    expect(html).toContain('data-docs-header-brand=""');
    expect(html).toContain(`>${brand.title}<`);
    expect(html).not.toContain(">Model Atlas<");
    expect(html).not.toMatch(/ModelAtlasDocsHeader|model-atlas-docs-header/);

    const expectedItems = getPrimaryNavItems(messages);
    expect(expectedItems.map((item) => item.label)).toEqual([
      ...CLI_PRIMARY_NAV_LABELS,
    ]);
    expect(expectedItems.map((item) => item.href)).toEqual([
      ...CLI_PRIMARY_NAV_HREFS,
    ]);

    const desktopNavMatch = html.match(
      /<nav[^>]*aria-label="Primary"[^>]*>([\s\S]*?)<\/nav>/,
    );
    expect(desktopNavMatch).toBeTruthy();
    const desktopNav = desktopNavMatch?.[1] ?? "";
    for (const item of expectedItems) {
      expect(desktopNav).toContain(`href="${item.href}"`);
      expect(desktopNav).toContain(`>${item.label}<`);
    }
    expect(desktopNav).not.toContain(`>${messages.nav.topology}<`);
    expect(desktopNav).not.toContain(`>${messages.nav.timeline}<`);
    expect(desktopNav).not.toContain('href="/topology"');
    expect(desktopNav).not.toContain('href="/docs/timeline"');

    expect(html).toContain('data-search=""');
    expect(html).toContain(`aria-label="${messages.search.open}"`);
    expect(messages.search.placeholder).toBe("Search you-agent-factory…");
    expect(messages.search.placeholder).not.toMatch(/Model Atlas/i);
    expect(messages.search.open).not.toMatch(/Model Atlas/i);
    expect(assertPrimaryNavNoDuplicateSearchLink(html)).toBeNull();
  });

  test("renders header search trigger without duplicate /search primary nav link", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader messages={messages} pageTree={source.pageTree} />
      </RootProvider>,
    );

    expect(assertPrimaryNavNoDuplicateSearchLink(html)).toBeNull();

    const expectedItems = getPrimaryNavItems(messages);
    expect(expectedItems.map((item) => item.href)).toEqual([
      "/blog",
      "/browse",
      "/docs/guides",
      "/docs/references",
    ]);

    for (const item of expectedItems) {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(`>${item.label}<`);
    }

    expect(html).not.toMatch(
      /<nav\b[^>]*\baria-label="Primary"[^>]*>[\s\S]*href="\/search"/i,
    );
    expect(html).toContain('data-search=""');
    expect(html).toContain(`aria-label="${messages.search.open}"`);
    expect(html).toContain(messages.search.shortcut);
    expect(html).toContain(`aria-label="${messages.language.open}"`);
    expect(html).toContain(`href="${YOU_AGENT_FACTORY_REPOSITORY_URL}"`);
    expect(html).toContain('aria-label="Open project GitHub repository"');
  });

  test("keeps Search as a first-class header destination without Model Atlas chrome copy", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader messages={messages} pageTree={source.pageTree} />
      </RootProvider>,
    );

    expect(messages.search.placeholder).toBe("Search you-agent-factory…");
    expect(messages.search.placeholder).not.toMatch(/Model Atlas/i);
    expect(messages.search.open).not.toMatch(/Model Atlas/i);
    expect(messages.search.shortcut).toBe("Search");
    expect(html).toContain('data-search=""');
    expect(html).toContain(`aria-label="${messages.search.open}"`);
    expect(html).toContain(messages.search.shortcut);
    expect(html).not.toMatch(/Model Atlas/i);
    expect(assertPrimaryNavNoDuplicateSearchLink(html)).toBeNull();
  });

  test("renders you-agent-factory brand chrome linking to the localized home route", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const brand = resolveSiteConfigLayoutNav(youAgentFactorySiteConfig);
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader
          messages={messages}
          pageTree={source.pageTree}
          siteConfig={youAgentFactorySiteConfig}
        />
      </RootProvider>,
    );

    expect(brand.title).toBe("YOU");
    expect(brand.url).toBe("/");
    expect(html).toContain('data-docs-header-brand=""');
    expect(html).toContain(DOCS_HEADER_BRAND_LINK_CLASS);
    expect(html).toContain(`href="${brand.url}"`);
    expect(html).toContain(`>${brand.title}<`);
    expect(html).not.toContain(">Model Atlas<");
    expect(html).toContain(`href="${YOU_AGENT_FACTORY_REPOSITORY_URL}"`);
  });

  test("sources brand title, home href, and repository link from site config", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const brand = resolveSiteConfigLayoutNav(alternateSiteConfig);
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader
          messages={messages}
          pageTree={source.pageTree}
          siteConfig={alternateSiteConfig}
        />
      </RootProvider>,
    );

    expect(brand.title).toBe("Example Docs");
    expect(brand.url).toBe("/");
    expect(html).toContain(`>${brand.title}<`);
    expect(html).toContain('data-docs-header-brand=""');
    expect(html).not.toContain(">you-agent-factory<");
    expect(html).toContain('href="https://github.com/example/example"');
    expect(html).not.toContain(`href="${YOU_AGENT_FACTORY_REPOSITORY_URL}"`);
    expect(html).toContain('aria-label="Open project GitHub repository"');
    expect(html).toContain('title="Open project GitHub repository"');
  });

  test("localizes the brand home destination on non-default locales", async () => {
    const messages = await loadUiMessages("vi");
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const brand = resolveSiteConfigLayoutNav(youAgentFactorySiteConfig, "vi");
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader
          messages={messages}
          pageTree={source.pageTree}
          locale="vi"
          siteConfig={youAgentFactorySiteConfig}
        />
      </RootProvider>,
    );

    expect(brand.title).toBe("YOU");
    expect(brand.url).toBe("/vi");
    expect(html).toContain('data-docs-header-brand=""');
    expect(html).toContain(`href="${brand.url}"`);
    expect(html).toContain(`>${brand.title}<`);
    expect(html).not.toContain(">Model Atlas<");
  });

  test("keeps the default repository URL from you-agent-factory site config", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader
          messages={messages}
          pageTree={source.pageTree}
          siteConfig={youAgentFactorySiteConfig}
        />
      </RootProvider>,
    );

    expect(html).toContain(`href="${youAgentFactorySiteConfig.repositoryUrl}"`);
    expect(youAgentFactorySiteConfig.repositoryUrl).toBe(
      YOU_AGENT_FACTORY_REPOSITORY_URL,
    );
  });

  test("mobile width markup hides desktop inline nav links and exposes the menu control", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader messages={messages} pageTree={source.pageTree} />
      </RootProvider>,
    );

    expect(html).toContain(PRIMARY_NAV_MOBILE_MENU_BUTTON_CLASS);
    expect(PRIMARY_NAV_MOBILE_MENU_BUTTON_CLASS).toBe("md:hidden");
    expect(html).toContain(`aria-label="${messages.nav.menu}"`);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="');
    expect(PRIMARY_NAV_DESKTOP_CLASS).toContain("hidden");
    expect(PRIMARY_NAV_DESKTOP_CLASS).toContain("md:flex");

    const desktopNavMatch = html.match(
      /<nav[^>]*aria-label="Primary"[^>]*>([\s\S]*?)<\/nav>/,
    );
    expect(desktopNavMatch).toBeTruthy();
    for (const item of getPrimaryNavItems(messages)) {
      expect(desktopNavMatch?.[1]).toContain(`href="${item.href}"`);
      expect(desktopNavMatch?.[1]).toContain(`>${item.label}<`);
    }

    expect(html).toContain('data-search=""');
    expect(html).toContain("flex min-w-0 w-full items-center gap-2");
    expect(html).toContain("min-w-0 flex-1 md:flex-none");
    expect(html).toContain(
      "flex w-full min-w-0 items-center justify-between !px-4 !py-2 md:inline-flex md:w-auto md:justify-start md:!px-3 md:!py-1.5",
    );
  });

  test("desktop width markup renders inline nav links and hides the menu control", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader messages={messages} pageTree={source.pageTree} />
      </RootProvider>,
    );

    expect(PRIMARY_NAV_DESKTOP_CLASS).toContain("md:flex");

    const expectedItems = getPrimaryNavItems(messages);
    for (const item of expectedItems) {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(`>${item.label}<`);
      expect(html).toContain(PRIMARY_NAV_LINK_CLASS);
    }

    expect(html).toContain(PRIMARY_NAV_MOBILE_MENU_BUTTON_CLASS);
    expect(PRIMARY_NAV_MOBILE_MENU_BUTTON_CLASS).toBe("md:hidden");
    expect(html).toContain('data-search=""');
    expect(html).toContain("grid-cols-[auto_1fr]");
    expect(html).toContain("[--fd-layout-width:97rem]");
    expect(html).toContain("md:[--fd-sidebar-width:268px]");
    expect(html).toContain("xl:[--fd-toc-width:268px]");
    expect(html).toContain("max-w-[900px]");
    expect(html).toContain("max-w-[1168px]");
    expect(html).toContain(
      "md:col-start-3 md:col-end-4 md:row-start-1 md:block",
    );
    // Desktop column gap must be zero so nav track matches #nd-page.
    expect(DOCS_HEADER_SHELL_CLASS).toContain("md:gap-0");
    expect(html).toContain('data-docs-header-shell=""');
    expect(html).toContain(DOCS_HEADER_SHELL_CLASS);
  });

  test("desktop primary nav and actions use the shared content-column left edge", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader messages={messages} pageTree={source.pageTree} />
      </RootProvider>,
    );

    expect(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS).toContain(
      CONTENT_COLUMN_CLASS,
    );
    expect(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS).toContain(
      CONTENT_COLUMN_INSET_CLASS,
    );
    expect(DOCS_HEADER_ACTIONS_COLUMN_CLASS).toContain(
      CONTENT_COLUMN_INSET_FROM_MD_CLASS,
    );
    expect(DOCS_HEADER_ACTIONS_COLUMN_CLASS).toContain("md:max-w-[1168px]");
    expect(
      usesNegativeMarginCompensation(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS),
    ).toBe(false);
    expect(
      usesNegativeMarginCompensation(DOCS_HEADER_ACTIONS_COLUMN_CLASS),
    ).toBe(false);

    expect(html).toContain(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS);
    expect(html).toContain(DOCS_HEADER_ACTIONS_COLUMN_CLASS);
    // Mobile shell keeps a single px-4 inset; no negative-margin compensation.
    expect(html).toContain("px-4 py-3");
    expect(html).toContain("md:px-0");
    // Mobile gap is fine; desktop must not add column gutters vs #nd-docs-layout.
    expect(DOCS_HEADER_SHELL_CLASS).toContain("gap-4");
    expect(DOCS_HEADER_SHELL_CLASS).toContain("md:gap-0");
    expect(html).not.toMatch(/(?:^|[\s"'])-m[trblxy]?-/);
  });

  test("desktop primary nav exposes CLI destinations without Topology or Timeline", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader messages={messages} pageTree={source.pageTree} />
      </RootProvider>,
    );

    const expectedItems = getPrimaryNavItems(messages);
    expect(expectedItems.map((item) => item.label)).toEqual([
      "Blog",
      "Docs",
      "Guides",
      "References",
    ]);
    expect(expectedItems.map((item) => item.href)).toEqual([
      "/blog",
      "/browse",
      "/docs/guides",
      "/docs/references",
    ]);

    const desktopNavMatch = html.match(
      /<nav[^>]*aria-label="Primary"[^>]*>([\s\S]*?)<\/nav>/,
    );
    expect(desktopNavMatch).toBeTruthy();
    const desktopNav = desktopNavMatch?.[1] ?? "";

    for (const item of expectedItems) {
      const escapedHref = item.href.replaceAll("&", "&amp;");
      expect(desktopNav).toContain(`href="${escapedHref}"`);
      expect(desktopNav).toContain(`>${item.label}<`);
    }

    expect(desktopNav).not.toContain(`>${messages.nav.home}<`);
    expect(desktopNav).not.toContain(`>${messages.nav.factories}<`);
    expect(desktopNav).not.toContain(`>${messages.nav.workers}<`);
    expect(desktopNav).not.toContain(`>${messages.nav.workstations}<`);
    expect(desktopNav).not.toContain(`>${messages.nav.glossary}<`);
    expect(desktopNav).not.toContain(`>${messages.nav.topology}<`);
    expect(desktopNav).not.toContain(`>${messages.nav.timeline}<`);
    expect(desktopNav).not.toContain('href="/"');
    expect(desktopNav).not.toContain('href="/docs/factories"');
    expect(desktopNav).not.toContain('href="/docs/glossary"');
    expect(desktopNav).not.toContain('href="/topology"');
    expect(desktopNav).not.toContain('href="/docs/timeline"');
    expect(html).toContain("flex-wrap");
    expect(html).toContain("gap-y-2");
  });

  test("desktop action cluster does not intercept pointer events from inline nav links", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader messages={messages} pageTree={source.pageTree} />
      </RootProvider>,
    );

    expect(html).toContain("pointer-events-none");
    expect(html).toContain("pointer-events-auto");
  });

  test("reveals mobile primary nav links in a disclosure panel when the menu opens", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    await renderWithAppProviders(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
      },
    );
    const menuButton = screen.getByRole("button", { name: messages.nav.menu });

    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(menuButton.getAttribute("aria-controls")).toBeTruthy();

    fireEvent.click(menuButton);

    expect(menuButton.getAttribute("aria-expanded")).toBe("true");

    const panelId = menuButton.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();

    const drawer = document.getElementById(panelId ?? "");
    expect(drawer).toBeTruthy();
    expect(drawer?.getAttribute("role")).toBe("dialog");
    expect(drawer?.getAttribute("aria-label")).toBe(
      messages.shell.sidebarTitle,
    );
    expect(
      within(drawer as HTMLElement).queryByText("You Agent Factory"),
    ).toBeNull();
    // Single non-product-name eyebrow — no second competing title line.
    expect(
      within(drawer as HTMLElement).getAllByText(messages.shell.sidebarTitle)
        .length,
    ).toBe(1);

    const expectedItems = getPrimaryNavItems(messages);
    for (const item of expectedItems) {
      const link = within(drawer as HTMLElement).getByRole("link", {
        name: item.label,
      });
      expect(link.getAttribute("href")).toBe(item.href);
    }
  });

  test("mobile drawer primary nav exposes the same CLI destinations", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    await renderWithAppProviders(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
      },
    );
    const menuButton = screen.getByRole("button", { name: messages.nav.menu });

    fireEvent.click(menuButton);

    const drawer = document.getElementById(
      menuButton.getAttribute("aria-controls") ?? "",
    );
    expect(drawer).toBeTruthy();

    const expectedItems = getPrimaryNavItems(messages);
    expect(expectedItems.map((item) => item.label)).toEqual([
      ...CLI_PRIMARY_NAV_LABELS,
    ]);
    for (const item of expectedItems) {
      const link = within(drawer as HTMLElement).getByRole("link", {
        name: item.label,
      });
      expect(link.getAttribute("href")).toBe(item.href);
      expect(link.className).toContain(PRIMARY_NAV_MOBILE_LINK_CLASS);
    }
    expect(
      within(drawer as HTMLElement).queryByRole("link", {
        name: messages.nav.topology,
      }),
    ).toBeNull();
    expect(
      within(drawer as HTMLElement).queryByRole("link", {
        name: messages.nav.timeline,
      }),
    ).toBeNull();
  });

  test("renders localized simplified header labels on a vietnamese route", async () => {
    const messages = await loadUiMessages("vi");
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader
          messages={messages}
          pageTree={source.pageTree}
          locale="vi"
        />
      </RootProvider>,
    );

    const expectedItems = getPrimaryNavItems(messages, "vi");

    const desktopNavMatch = html.match(
      /<nav[^>]*aria-label="Primary"[^>]*>([\s\S]*?)<\/nav>/,
    );
    expect(desktopNavMatch).toBeTruthy();
    for (const item of expectedItems) {
      const escapedHref = item.href.replaceAll("&", "&amp;");
      expect(desktopNavMatch?.[1]).toContain(`href="${escapedHref}"`);
      expect(desktopNavMatch?.[1]).toContain(`>${item.label}<`);
    }
    expect(desktopNavMatch?.[1]).toContain(">Hướng dẫn<");
    expect(desktopNavMatch?.[1]).toContain(">Tài liệu<");
    expect(desktopNavMatch?.[1]).not.toContain(">Trang chủ<");
    expect(desktopNavMatch?.[1]).not.toContain(">Thuật ngữ<");
    expect(html).not.toContain(">Dòng thời gian<");
    expect(html).not.toContain(">Bản đồ<");
  });

  test("reveals localized mobile primary nav links when the menu opens on a vietnamese route", async () => {
    const messages = await loadUiMessages("vi");
    const SearchDialog: ComponentType<SharedProps> = () => null;
    await renderWithAppProviders(
      <DocsHeader messages={messages} pageTree={source.pageTree} locale="vi" />,
      {
        SearchDialog,
      },
    );
    const menuButton = screen.getByRole("button", { name: messages.nav.menu });

    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(menuButton.getAttribute("aria-controls")).toBeTruthy();

    fireEvent.click(menuButton);

    expect(menuButton.getAttribute("aria-expanded")).toBe("true");

    const panelId = menuButton.getAttribute("aria-controls");
    const drawer = document.getElementById(panelId ?? "");
    expect(drawer).toBeTruthy();
    expect(drawer?.getAttribute("role")).toBe("dialog");

    const expectedItems = getPrimaryNavItems(messages, "vi");
    for (const item of expectedItems) {
      const link = within(drawer as HTMLElement).getByRole("link", {
        name: item.label,
      });
      expect(link.getAttribute("href")).toBe(item.href);
      expect(link.className).toContain(PRIMARY_NAV_MOBILE_LINK_CLASS);
    }
    expect(
      within(drawer as HTMLElement).queryByRole("link", { name: "Trang chủ" }),
    ).toBeNull();
    expect(
      within(drawer as HTMLElement).getByRole("link", {
        name: "Hướng dẫn",
      }),
    ).toBeTruthy();
    expect(
      within(drawer as HTMLElement).getByRole("link", {
        name: "Tài liệu",
      }),
    ).toBeTruthy();
    expect(
      within(drawer as HTMLElement).queryByRole("link", {
        name: "Thuật ngữ",
      }),
    ).toBeNull();
    expect(
      within(drawer as HTMLElement).queryByRole("link", {
        name: "Dòng thời gian",
      }),
    ).toBeNull();
  });

  test("closes the mobile menu when a localized primary nav link is clicked", async () => {
    const messages = await loadUiMessages("vi");
    const SearchDialog: ComponentType<SharedProps> = () => null;
    await renderWithAppProviders(
      <DocsHeader messages={messages} pageTree={source.pageTree} locale="vi" />,
      {
        SearchDialog,
      },
    );
    const menuButton = screen.getByRole("button", { name: messages.nav.menu });

    fireEvent.click(menuButton);
    expect(menuButton.getAttribute("aria-expanded")).toBe("true");

    const drawer = document.getElementById(
      menuButton.getAttribute("aria-controls") ?? "",
    );
    expect(drawer).toBeTruthy();

    const docsLink = within(drawer as HTMLElement).getByRole("link", {
      name: "Tài liệu",
    });
    fireEvent.click(docsLink);

    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(
      document.getElementById(menuButton.getAttribute("aria-controls") ?? ""),
    ).toBeNull();
  });

  test("closes the mobile menu and hides the disclosure panel when toggled off", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    await renderWithAppProviders(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
      },
    );
    const menuButton = screen.getByRole("button", { name: messages.nav.menu });

    fireEvent.click(menuButton);
    expect(menuButton.getAttribute("aria-expanded")).toBe("true");
    const drawer = document.getElementById(
      menuButton.getAttribute("aria-controls") ?? "",
    );
    expect(drawer).toBeTruthy();

    fireEvent.click(menuButton);
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(
      document.getElementById(menuButton.getAttribute("aria-controls") ?? ""),
    ).toBeNull();
  });

  test("exposes focus-visible ring classes on menu control, nav links, and search trigger", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader messages={messages} pageTree={source.pageTree} />
      </RootProvider>,
    );

    expect(html).toContain("focus-visible:ring-ring");
    expect(html).toContain(PRIMARY_NAV_LINK_CLASS);
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain('data-slot="button"');
    expect(html).toContain("focus-visible:ring-3");
  });

  test("moves keyboard focus through menu control, brand link, and search trigger when open", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    await renderWithAppProviders(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
      },
    );
    const user = userEvent.setup();
    const menuButton = screen.getByRole("button", { name: messages.nav.menu });
    const brandLink = screen.getByRole("link", { name: "YOU" });
    const searchTrigger = screen.getByRole("button", {
      name: messages.search.open,
    });
    const expectedItems = getPrimaryNavItems(messages);

    await user.tab();
    expect(document.activeElement).toBe(menuButton);

    fireEvent.click(menuButton);

    const panelId = menuButton.getAttribute("aria-controls");
    const drawer = document.getElementById(panelId ?? "");
    expect(drawer).toBeTruthy();
    const primaryNav = within(drawer as HTMLElement).getByRole("navigation", {
      name: "Primary",
    });
    const panelLinks = within(primaryNav).getAllByRole("link");
    expect(panelLinks).toHaveLength(expectedItems.length);

    await user.tab();
    expect(document.activeElement).toBe(brandLink);

    await user.tab();
    expect(document.activeElement).toBe(searchTrigger);
  });

  test("opens a language selector with locale-preserving links", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/docs/glossary/token?tag=attention");
    renderHeaderWithNavigation(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
        pathname: "/docs/glossary/token",
        searchParams: new URLSearchParams("tag=attention"),
      },
    );

    await user.click(
      screen.getByRole("button", { name: messages.language.open }),
    );

    const dialog = screen.getByRole("menu");

    expect(
      within(dialog)
        .getByRole("menuitem", { name: /English/i })
        .getAttribute("href"),
    ).toBe("/docs/glossary/token?tag=attention");
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /Tiếng Việt/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /日本語/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /简体中文/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(dialog.textContent).toContain(messages.language.unavailable);
  });

  test("lists zh-CN and navigates to /zh-CN on available surfaces while preserving query params", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/search?q=attention&tag=attention");
    renderHeaderWithNavigation(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
        pathname: "/search",
        searchParams: new URLSearchParams("q=attention&tag=attention"),
      },
    );

    await user.click(
      screen.getByRole("button", { name: messages.language.open }),
    );

    const dialog = screen.getByRole("menu");
    const zhCnOption = within(dialog).getByRole("menuitem", {
      name: /简体中文/,
    });

    expect(zhCnOption.getAttribute("aria-disabled")).not.toBe("true");
    expect(zhCnOption.getAttribute("href")).toBe(
      "/zh-CN/search?q=attention&tag=attention",
    );
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /English/i })
        .getAttribute("href"),
    ).toBe("/search?q=attention&tag=attention");
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /^Tiếng Việt$/i })
        .getAttribute("href"),
    ).toBe("/vi/search?q=attention&tag=attention");
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /日本語/ })
        .getAttribute("href"),
    ).toBe("/ja/search?q=attention&tag=attention");
  });

  test("keeps language switching available on filled high-traffic docs pages", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const user = userEvent.setup();
    const pathname = "/docs/guides/getting-started";
    window.history.replaceState({}, "", pathname);
    renderHeaderWithNavigation(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
        pathname,
      },
    );

    await user.click(
      screen.getByRole("button", { name: messages.language.open }),
    );

    const dialog = screen.getByRole("menu");
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /English/i })
        .getAttribute("href"),
    ).toBe(pathname);
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /日本語/ })
        .getAttribute("href"),
    ).toBe(`/ja${pathname}`);
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /简体中文/ })
        .getAttribute("href"),
    ).toBe(`/zh-CN${pathname}`);
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /^Tiếng Việt$/i })
        .getAttribute("href"),
    ).toBe(`/vi${pathname}`);
    for (const name of [/日本語/, /简体中文/, /^Tiếng Việt$/i]) {
      expect(
        within(dialog)
          .getByRole("menuitem", { name })
          .getAttribute("aria-disabled"),
      ).not.toBe("true");
    }
  });

  test("renders localized simplified header labels on a zh-CN route", async () => {
    const messages = await loadUiMessages("zh-CN");
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const html = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader
          messages={messages}
          pageTree={source.pageTree}
          locale="zh-CN"
        />
      </RootProvider>,
    );

    const expectedItems = getPrimaryNavItems(messages, "zh-CN");
    const desktopNavMatch = html.match(
      /<nav[^>]*aria-label="Primary"[^>]*>([\s\S]*?)<\/nav>/,
    );
    expect(desktopNavMatch).toBeTruthy();
    for (const item of expectedItems) {
      const escapedHref = item.href.replaceAll("&", "&amp;");
      expect(desktopNavMatch?.[1]).toContain(`href="${escapedHref}"`);
      expect(desktopNavMatch?.[1]).toContain(`>${item.label}<`);
    }
    expect(desktopNavMatch?.[1]).toContain(">指南<");
    expect(desktopNavMatch?.[1]).toContain(">文档<");
    expect(desktopNavMatch?.[1]).not.toContain(">首页<");
    expect(desktopNavMatch?.[1]).not.toContain(">术语表<");
  });

  test("keeps the language and GitHub header controls on the same outline button contract", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    renderHeaderWithNavigation(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
      },
    );

    const languageButton = screen.getByRole("button", {
      name: messages.language.open,
    });
    const githubLink = screen.getByRole("link", {
      name: "Open project GitHub repository",
    });

    expect(languageButton.className).toContain("header-action-icon");
    expect(githubLink.className).toContain("header-action-icon");
    expect(languageButton.className).toContain("!border-border");
    expect(githubLink.className).toContain("!border-border");
    expect(languageButton.className).toContain("hover:!bg-[color-mix");
    expect(githubLink.className).toContain("hover:!bg-[color-mix");
  });

  test("shows unavailable locales for docs pages that are not shipped in that locale", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/docs/modules/sparse-attention");
    renderHeaderWithNavigation(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
        pathname: "/docs/modules/sparse-attention",
      },
    );

    await user.click(
      screen.getByRole("button", { name: messages.language.open }),
    );

    const dialog = screen.getByRole("menu");

    expect(
      within(dialog)
        .getByRole("menuitem", { name: /English/i })
        .getAttribute("href"),
    ).toBe("/docs/modules/sparse-attention");
    expect(
      within(dialog).queryByRole("menuitem", {
        name: /Tiếng Việt/,
      }),
    ).toBeTruthy();
    expect(
      within(dialog).queryByRole("menuitem", { name: /日本語/ }),
    ).toBeTruthy();
    expect(
      within(dialog)
        .getByRole("menuitem", { name: /简体中文/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(dialog.textContent).toContain(messages.language.unavailable);
  });

  test("keeps references family index locales available and marks unshipped reference child locales unavailable", async () => {
    const messages = await loadUiMessages();
    const SearchDialog: ComponentType<SharedProps> = () => null;
    const user = userEvent.setup();

    window.history.replaceState({}, "", "/docs/references");
    const { unmount: unmountIndex } = renderHeaderWithNavigation(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
        pathname: "/docs/references",
      },
    );

    await user.click(
      screen.getByRole("button", { name: messages.language.open }),
    );
    const indexDialog = screen.getByRole("menu");
    expect(
      within(indexDialog)
        .getByRole("menuitem", { name: /日本語/ })
        .getAttribute("href"),
    ).toBe("/ja/docs/references");
    expect(
      within(indexDialog)
        .getByRole("menuitem", { name: /简体中文/ })
        .getAttribute("href"),
    ).toBe("/zh-CN/docs/references");
    expect(
      within(indexDialog)
        .getByRole("menuitem", { name: /Tiếng Việt/ })
        .getAttribute("href"),
    ).toBe("/vi/docs/references");
    unmountIndex();

    window.history.replaceState({}, "", "/docs/references/cli");
    renderHeaderWithNavigation(
      <DocsHeader messages={messages} pageTree={source.pageTree} />,
      {
        SearchDialog,
        pathname: "/docs/references/cli",
      },
    );

    await user.click(
      screen.getByRole("button", { name: messages.language.open }),
    );
    const cliDialog = screen.getByRole("menu");
    expect(
      within(cliDialog)
        .getByRole("menuitem", { name: /English/i })
        .getAttribute("href"),
    ).toBe("/docs/references/cli");
    expect(
      within(cliDialog)
        .getByRole("menuitem", { name: /日本語/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(
      within(cliDialog)
        .getByRole("menuitem", { name: /简体中文/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(
      within(cliDialog)
        .getByRole("menuitem", { name: /Tiếng Việt/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    expect(cliDialog.textContent).toContain(messages.language.unavailable);
  });
});
