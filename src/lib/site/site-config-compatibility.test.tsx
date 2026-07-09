import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeArticle } from "@/components/home/home-article";
import { getPrimaryNavItems } from "@/components/layout/primary-nav";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  buildLocalizedRoute,
  supportedLocales,
} from "@/lib/i18n/locale-routing";
import { baseOptions } from "@/lib/layout.shared";
import { SCAFFOLD_ID, SITE_BRAND_NAME, SITE_HEADING } from "@/lib/scaffold";
import {
  resolveSiteConfigHomeFeaturedLinkHrefs,
  resolveSiteConfigHomeFeaturedLinks,
  resolveSiteConfigLayoutNav,
  resolveSiteConfigPrimaryNavHrefs,
  resolveSiteConfigRepositoryUrl,
} from "./site-config-resolution";
import {
  YOU_AGENT_FACTORY_REPOSITORY_URL,
  youAgentFactorySiteConfig,
} from "./you-agent-factory-site-config";

const PROJECT_GITHUB_URL = "https://github.com/portpowered/you-agent-factory";

function extractHrefAttributes(html: string): string[] {
  const hrefs: string[] = [];
  const pattern = /href="([^"]+)"/g;

  for (const match of html.matchAll(pattern)) {
    hrefs.push(match[1]);
  }

  return hrefs;
}

describe("site config scaffold compatibility", () => {
  test("keeps scaffold brand exports aligned with the default config", () => {
    expect(youAgentFactorySiteConfig.brand.scaffoldId).toBe(SCAFFOLD_ID);
    expect(youAgentFactorySiteConfig.brand.brandName).toBe(SITE_BRAND_NAME);
    expect(youAgentFactorySiteConfig.brand.siteHeading).toBe(SITE_HEADING);
  });

  test("keeps the default repository URL aligned with the current header link", () => {
    expect(youAgentFactorySiteConfig.repositoryUrl).toBe(
      YOU_AGENT_FACTORY_REPOSITORY_URL,
    );
    expect(youAgentFactorySiteConfig.repositoryUrl).toBe(PROJECT_GITHUB_URL);
    expect(resolveSiteConfigRepositoryUrl(youAgentFactorySiteConfig)).toBe(
      PROJECT_GITHUB_URL,
    );
  });

  test("keeps the default home route surface aligned with layout nav title link", () => {
    for (const locale of supportedLocales) {
      expect(
        buildLocalizedRoute(
          youAgentFactorySiteConfig.routeSurfaces.home,
          locale,
        ),
      ).toBe(buildLocalizedRoute({ surface: "home" }, locale));
      expect(baseOptions(locale).nav?.url).toBe(
        buildLocalizedRoute(
          youAgentFactorySiteConfig.routeSurfaces.home,
          locale,
        ),
      );
    }
  });

  test("keeps the layout nav title aligned with the you-agent-factory brand name", () => {
    expect(youAgentFactorySiteConfig.brand.brandName).toBe("you-agent-factory");
    expect(resolveSiteConfigLayoutNav(youAgentFactorySiteConfig).title).toBe(
      "you-agent-factory",
    );
    expect(baseOptions().nav?.title).toBe("you-agent-factory");
    expect(baseOptions().nav?.title).toBe(
      youAgentFactorySiteConfig.brand.brandName,
    );
  });
});

describe("site config primary nav compatibility", () => {
  test("resolves the same hrefs as getPrimaryNavItems for supported locales", async () => {
    const messages = await loadUiMessages();

    for (const locale of supportedLocales) {
      const configHrefs = resolveSiteConfigPrimaryNavHrefs(
        youAgentFactorySiteConfig,
        locale,
      );
      const consumerHrefs = getPrimaryNavItems(messages, locale).map(
        (item) => item.href,
      );

      expect(configHrefs).toEqual(consumerHrefs);
    }
  });

  test("binds primary nav labels through the same message keys", async () => {
    const messages = await loadUiMessages();

    const configLabels = youAgentFactorySiteConfig.primaryNav.map(
      (entry) => messages.nav[entry.labelKey],
    );
    const consumerLabels = getPrimaryNavItems(messages).map(
      (item) => item.label,
    );

    expect(configLabels).toEqual(consumerLabels);
  });

  test("preserves vietnamese primary nav hrefs and translated labels from config", async () => {
    const messages = await loadUiMessages("vi");
    const items = getPrimaryNavItems(messages, "vi");

    expect(items.map((item) => item.href)).toEqual([
      "/vi",
      "/vi/docs/guides",
      "/vi/browse",
      "/vi/docs/glossary",
      "/vi/blog",
    ]);
    expect(items.map((item) => item.label)).toEqual([
      "Trang chủ",
      messages.nav.guides,
      messages.nav.docs,
      "Thuật ngữ",
      messages.nav.blog,
    ]);
    expect(items.some((item) => item.href === "/vi/topology")).toBe(false);
    expect(items.some((item) => item.href === "/vi/docs/timeline")).toBe(false);
  });
});

describe("site config home featured link compatibility", () => {
  test("resolves the same hrefs as HomeArticle for supported locales", async () => {
    const messages = await loadUiMessages();

    for (const locale of supportedLocales) {
      const configHrefs = resolveSiteConfigHomeFeaturedLinkHrefs(
        youAgentFactorySiteConfig,
        locale,
      );
      const html = renderToStaticMarkup(
        <HomeArticle
          messages={messages}
          siteConfig={youAgentFactorySiteConfig}
          locale={locale}
        />,
      );
      const consumerHrefs = extractHrefAttributes(html).filter((href) =>
        configHrefs.includes(href),
      );

      expect(configHrefs.length).toBeGreaterThan(0);
      expect(consumerHrefs).toEqual(configHrefs);
    }
  });

  test("default featured-link resolution emits no Atlas module destinations", () => {
    for (const locale of supportedLocales) {
      const hrefs = resolveSiteConfigHomeFeaturedLinkHrefs(
        youAgentFactorySiteConfig,
        locale,
      );
      expect(hrefs.length).toBeGreaterThan(0);
      expect(
        hrefs.some(
          (href) =>
            href.includes("/docs/modules/grouped-query-attention") ||
            href.includes("/docs/modules/swiglu") ||
            href.includes("/docs/modules/relu"),
        ),
      ).toBe(false);
    }
  });

  test("binds featured link copy through the same home message keys", async () => {
    const messages = await loadUiMessages();

    const configLinks = resolveSiteConfigHomeFeaturedLinks(
      youAgentFactorySiteConfig,
      messages,
    );

    expect(youAgentFactorySiteConfig.homeFeaturedLinks).toHaveLength(4);
    expect(configLinks).toEqual([
      {
        href: "/docs/guides",
        title: messages.home.guidesLinkTitle,
        description: messages.home.guidesLinkDescription,
      },
      {
        href: "/browse",
        title: messages.home.docsLinkTitle,
        description: messages.home.docsLinkDescription,
      },
      {
        href: "/docs/glossary",
        title: messages.home.glossaryLinkTitle,
        description: messages.home.glossaryLinkDescription,
      },
      {
        href: "/blog",
        title: messages.home.blogLinkTitle,
        description: messages.home.blogLinkDescription,
      },
    ]);
  });
});
