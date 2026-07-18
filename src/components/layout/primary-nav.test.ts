import { describe, expect, it } from "bun:test";
import {
  getPrimaryNavItems,
  PRIMARY_NAV_DESKTOP_CLASS,
  PRIMARY_NAV_LINK_CLASS,
  PRIMARY_NAV_MOBILE_LINK_CLASS,
  PRIMARY_NAV_MOBILE_MENU_BUTTON_CLASS,
  PRIMARY_NAV_MOBILE_PANEL_CLASS,
} from "@/components/layout/primary-nav";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { resolveSiteNavigationHrefs } from "@/lib/navigation/site-navigation-href";
import type { SiteConfig } from "@/lib/site/site-config.contract";

/** Product-order CLI primary destinations for the you-agent-factory shell. */
const CLI_PRIMARY_NAV_HREFS = [
  "/",
  "/docs/guides",
  "/browse",
  "/docs/references",
  "/docs/factories",
  "/docs/workers",
  "/docs/workstations",
  "/docs/glossary",
  "/blog",
] as const;

const CLI_PRIMARY_NAV_LABELS = [
  "Home",
  "Guides",
  "Docs",
  "References",
  "Factories",
  "Workers",
  "Workstations",
  "Glossary",
  "Blog",
] as const;

/** Stable relative order of W15 family destinations inside primary nav. */
const W15_FAMILY_NAV_HREFS = [
  "/docs/references",
  "/docs/factories",
  "/docs/workers",
  "/docs/workstations",
] as const;

describe("getPrimaryNavItems", () => {
  it("lists CLI docs primary nav routes in order", async () => {
    const messages = await loadUiMessages();
    const items = getPrimaryNavItems(messages);

    expect(items.map((item) => item.href)).toEqual([...CLI_PRIMARY_NAV_HREFS]);
    expect(items.map((item) => item.label)).toEqual([
      ...CLI_PRIMARY_NAV_LABELS,
    ]);
    expect(items.map((item) => item.label)).toEqual([
      messages.nav.home,
      messages.nav.guides,
      messages.nav.docs,
      messages.nav.references,
      messages.nav.factories,
      messages.nav.workers,
      messages.nav.workstations,
      messages.nav.glossary,
      messages.nav.blog,
    ]);
    expect(items.some((item) => item.href === "/topology")).toBe(false);
    expect(items.some((item) => item.href === "/docs/timeline")).toBe(false);
    expect(items.some((item) => item.label === messages.nav.topology)).toBe(
      false,
    );
    expect(items.some((item) => item.label === messages.nav.timeline)).toBe(
      false,
    );
  });

  it("keeps W15 family destinations in stable relative order", async () => {
    const messages = await loadUiMessages();
    const familyHrefs = getPrimaryNavItems(messages)
      .map((item) => item.href)
      .filter((href) =>
        (W15_FAMILY_NAV_HREFS as readonly string[]).includes(href),
      );

    expect(familyHrefs).toEqual([...W15_FAMILY_NAV_HREFS]);
  });

  it("can emit vietnamese-prefixed navigation routes from the shared locale contract", async () => {
    const messages = await loadUiMessages("vi");
    const items = getPrimaryNavItems(messages, "vi");

    expect(items.map((item) => item.href)).toEqual([
      "/vi",
      "/vi/docs/guides",
      "/vi/browse",
      "/vi/docs/references",
      "/vi/docs/factories",
      "/vi/docs/workers",
      "/vi/docs/workstations",
      "/vi/docs/glossary",
      "/vi/blog",
    ]);
    expect(items.map((item) => item.label)).toEqual([
      messages.nav.home,
      messages.nav.guides,
      messages.nav.docs,
      messages.nav.references,
      messages.nav.factories,
      messages.nav.workers,
      messages.nav.workstations,
      messages.nav.glossary,
      messages.nav.blog,
    ]);
    expect(items.map((item) => item.label)).toEqual([
      "Trang chủ",
      "Hướng dẫn",
      "Tài liệu",
      messages.nav.references,
      messages.nav.factories,
      messages.nav.workers,
      messages.nav.workstations,
      "Thuật ngữ",
      messages.nav.blog,
    ]);
  });

  it("emits japanese and zh-CN prefixed navigation routes with localized labels", async () => {
    const jaMessages = await loadUiMessages("ja");
    const zhCnMessages = await loadUiMessages("zh-CN");
    const jaItems = getPrimaryNavItems(jaMessages, "ja");
    const zhCnItems = getPrimaryNavItems(zhCnMessages, "zh-CN");

    expect(jaItems.map((item) => item.href)).toEqual([
      "/ja",
      "/ja/docs/guides",
      "/ja/browse",
      "/ja/docs/references",
      "/ja/docs/factories",
      "/ja/docs/workers",
      "/ja/docs/workstations",
      "/ja/docs/glossary",
      "/ja/blog",
    ]);
    expect(jaItems.map((item) => item.label)).toEqual([
      "ホーム",
      "ガイド",
      "ドキュメント",
      jaMessages.nav.references,
      jaMessages.nav.factories,
      jaMessages.nav.workers,
      jaMessages.nav.workstations,
      "用語集",
      jaMessages.nav.blog,
    ]);

    expect(zhCnItems.map((item) => item.href)).toEqual([
      "/zh-CN",
      "/zh-CN/docs/guides",
      "/zh-CN/browse",
      "/zh-CN/docs/references",
      "/zh-CN/docs/factories",
      "/zh-CN/docs/workers",
      "/zh-CN/docs/workstations",
      "/zh-CN/docs/glossary",
      "/zh-CN/blog",
    ]);
    expect(zhCnItems.map((item) => item.label)).toEqual([
      "首页",
      "指南",
      "文档",
      zhCnMessages.nav.references,
      zhCnMessages.nav.factories,
      zhCnMessages.nav.workers,
      zhCnMessages.nav.workstations,
      "术语表",
      zhCnMessages.nav.blog,
    ]);
    expect(zhCnMessages.nav.guides).not.toBe("Guides");
    expect(zhCnMessages.nav.docs).not.toBe("Docs");
  });

  it("resolves primary nav home/docs/blog under project-site base path without changing Link hrefs", async () => {
    const messages = await loadUiMessages();
    const items = getPrimaryNavItems(messages);
    const hrefs = items.map((item) => item.href);

    // Link consumers keep unprefixed app hrefs (Next basePath prefixes at render).
    expect(hrefs).toEqual([...CLI_PRIMARY_NAV_HREFS]);

    const projectSiteHrefs = resolveSiteNavigationHrefs(
      hrefs,
      BUILT_APP_GITHUB_PAGES_BASE_PATH,
    );
    expect(projectSiteHrefs[0]).toBe("/you-agent-factory-docs/");
    expect(projectSiteHrefs[1]).toBe("/you-agent-factory-docs/docs/guides");
    expect(projectSiteHrefs[8]).toBe("/you-agent-factory-docs/blog");
    expect(resolveSiteNavigationHrefs(hrefs, "")).toEqual(hrefs);
  });

  it("omits duplicate /search link from primary navigation", async () => {
    const messages = await loadUiMessages();
    const items = getPrimaryNavItems(messages);

    expect(items.some((item) => item.href === "/search")).toBe(false);
  });

  it("builds ordered items from configured primary nav entries", async () => {
    const messages = await loadUiMessages();
    const customConfig = {
      brand: {
        scaffoldId: "example-scaffold",
        brandName: "Example Atlas",
        siteHeading: "Example Reference",
      },
      repositoryUrl: "https://github.com/example/example",
      routeSurfaces: {
        home: { surface: "home" },
        browse: { surface: "browse" },
        topology: { surface: "topology" },
        timeline: { surface: "docs-page", slug: "timeline" },
        blogIndex: { surface: "blog-index" },
        tagsIndex: { surface: "tags-index" },
      },
      primaryNav: [
        { routeSurface: "tagsIndex", labelKey: "tags" },
        { routeSurface: "home", labelKey: "home" },
      ],
      collections: [
        { family: "guides" },
        { family: "concepts" },
        { family: "techniques" },
        { family: "documentation" },
      ],
      homeFeaturedLinks: [],
    } satisfies SiteConfig;

    const items = getPrimaryNavItems(messages, "en", {
      siteConfig: customConfig,
    });

    expect(items.map((item) => item.href)).toEqual(["/tags", "/"]);
    expect(items.map((item) => item.label)).toEqual([
      messages.nav.tags,
      messages.nav.home,
    ]);
  });

  it("throws when a primary nav entry references a missing route surface", async () => {
    const messages = await loadUiMessages();
    const brokenConfig = {
      brand: {
        scaffoldId: "example-scaffold",
        brandName: "Example Atlas",
        siteHeading: "Example Reference",
      },
      repositoryUrl: "https://github.com/example/example",
      routeSurfaces: {
        home: { surface: "home" },
      },
      primaryNav: [{ routeSurface: "missingSurface", labelKey: "home" }],
      collections: [],
      homeFeaturedLinks: [],
    } as SiteConfig;

    expect(() =>
      getPrimaryNavItems(messages, "en", { siteConfig: brokenConfig }),
    ).toThrow("Missing site config route surface: missingSurface");
  });

  it("uses ring token focus styles on nav links", () => {
    expect(PRIMARY_NAV_LINK_CLASS).toContain("focus-visible:ring-ring");
  });

  it("exports responsive header class contracts", () => {
    expect(PRIMARY_NAV_DESKTOP_CLASS).toContain("hidden");
    expect(PRIMARY_NAV_DESKTOP_CLASS).toContain("md:flex");
    expect(PRIMARY_NAV_MOBILE_MENU_BUTTON_CLASS).toBe("md:hidden");
    expect(PRIMARY_NAV_MOBILE_PANEL_CLASS).toContain("order-last");
    expect(PRIMARY_NAV_MOBILE_PANEL_CLASS).toContain("w-full");
    expect(PRIMARY_NAV_MOBILE_PANEL_CLASS).toContain("md:hidden");
    expect(PRIMARY_NAV_MOBILE_LINK_CLASS).toContain("focus-visible:ring-ring");
  });
});
