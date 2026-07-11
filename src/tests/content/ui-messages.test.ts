import { afterEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  formatPageKind,
  loadUiMessages,
  UI_MESSAGES_COMPATIBILITY_KEYS,
} from "@/lib/content/ui-messages";
import type {
  FactoryDomainMessages,
  ShellMessages,
} from "@/lib/content/ui-messages.types";
import {
  loadUiMessagesFromDisk,
  UiMessagesLoadError,
} from "@/lib/content/ui-messages-load";

const SHELL_MESSAGE_KEYS = ["search", "nav", "language", "shell"] as const;

const DOCS_MESSAGE_KEYS = [
  "searchEntry",
  "home",
  "browseIndex",
  "glossaryIndex",
  "architectureIndex",
  "blogIndex",
  "pageKind",
] as const;

const FACTORY_DOMAIN_MESSAGE_KEYS = [
  "conceptsIndex",
  "guidesIndex",
  "techniquesIndex",
  "documentationIndex",
  "tagsIndex",
  "tagLanding",
  "tagCategories",
] as const;

function acceptsShellMessages(messages: ShellMessages): ShellMessages {
  return messages;
}

function acceptsFactoryDomainMessages(
  messages: FactoryDomainMessages,
): FactoryDomainMessages {
  return messages;
}

function pickShellMessages(messages: ShellMessages): ShellMessages {
  return {
    search: messages.search,
    nav: messages.nav,
    language: messages.language,
    shell: messages.shell,
  };
}

function pickFactoryDomainMessages(
  messages: FactoryDomainMessages,
): FactoryDomainMessages {
  return {
    conceptsIndex: messages.conceptsIndex,
    guidesIndex: messages.guidesIndex,
    techniquesIndex: messages.techniquesIndex,
    documentationIndex: messages.documentationIndex,
    tagsIndex: messages.tagsIndex,
    tagLanding: messages.tagLanding,
    tagCategories: messages.tagCategories,
  };
}

describe("loadUiMessages shell keys", () => {
  const tempMessagesRoot = join(
    import.meta.dir,
    "__fixtures__",
    `ui-messages-${crypto.randomUUID()}`,
  );

  afterEach(async () => {
    await rm(tempMessagesRoot, { recursive: true, force: true });
  });

  it("loads shell copy for the docs layout", async () => {
    const messages = await loadUiMessages();
    expect(messages.shell.sidebarTitle.length).toBeGreaterThan(0);
    expect(messages.shell.openingSummary).toBe("Opening summary");
    expect(messages.searchEntry.title).toBe("Search");
    expect(messages.browseIndex.title).toBe("Browse");
    expect(messages.conceptsIndex.title).toBe("Concepts");
    expect(messages.guidesIndex.title).toBe("Guides");
    expect(messages.architectureIndex.title).toBe("Architecture");
    expect(messages.glossaryIndex.title).toBe("Glossary");
    expect(messages.blogIndex.title).toBe("Blog");
    expect(messages.tagsIndex.title).toBe("Tags");
  });

  it("loads shipped vietnamese shell copy when vi shared messages are available", async () => {
    const messages = await loadUiMessages("vi");
    expect(messages.search.placeholder).toBe("Tìm trong you-agent-factory…");
    expect(messages.search.placeholder).not.toMatch(/Model Atlas/i);
    expect(messages.searchEntry.description).not.toMatch(/Model Atlas/i);
    expect(messages.shell.openingSummary).toBe("Tóm tắt mở đầu");
  });

  it("loads shipped japanese shell copy when ja shared messages are available", async () => {
    const messages = await loadUiMessages("ja");
    expect(messages.search.placeholder).toBe("you-agent-factory を検索…");
    expect(messages.search.placeholder).not.toMatch(/Model Atlas/i);
    expect(messages.searchEntry.description).not.toMatch(/Model Atlas/i);
    expect(messages.nav.home).toBe("ホーム");
    expect(messages.browseIndex.title).toBe("参照");
    expect(messages.shell.openingSummary).toBe("要約を開く");
  });

  it("loads shipped chinese simplified shell copy when zh-CN shared messages are available", async () => {
    const messages = await loadUiMessages("zh-CN");
    expect(messages.nav.home).toBe("首页");
    expect(messages.nav.search).toBe("搜索");
    expect(messages.nav.guides).toBe("指南");
    expect(messages.nav.docs).toBe("文档");
    expect(messages.nav.guides).not.toBe("Guides");
    expect(messages.nav.docs).not.toBe("Docs");
    expect(messages.search.placeholder).toBe("搜索 you-agent-factory…");
    expect(messages.search.placeholder).not.toMatch(/Model Atlas/i);
    expect(messages.searchEntry.description).not.toMatch(/Model Atlas/i);
    expect(messages.language.selectorLabel).toBe("语言");
    expect(messages.language.locales["zh-CN"]).toBe("简体中文");
    expect(messages.browseIndex.title).toBe("浏览");
    expect(messages.conceptsIndex.title).toBe("概念");
  });

  it("loads factory-only public search and index copy across shipped locales", async () => {
    const atlasOwnership =
      /Model Atlas|\batlas\b|アトラス|图谱|Duyệt Atlas|Browse the Atlas/i;
    const retiredSurfaceInvite =
      /\bmodels?\b|\bmodules?\b|\bpapers?\b|\btraining\b|モジュール|モデル|論文|学习|训练|论文|mô hình|module|bài báo|huấn luyện/i;

    for (const locale of ["en", "ja", "zh-CN", "vi"] as const) {
      const messages = await loadUiMessages(locale);
      const publicCopy = [
        messages.search.idle,
        messages.searchEntry.description,
        messages.shell.sidebarDescription,
        messages.conceptsIndex.description,
        messages.glossaryIndex.description,
        messages.glossaryIndex.emptyDescription,
        messages.architectureIndex.description,
        messages.architectureIndex.emptyDescription,
        messages.blogIndex.description,
        messages.blogIndex.emptyDescription,
        messages.tagsIndex.description,
      ];

      for (const value of publicCopy) {
        expect(value).not.toMatch(atlasOwnership);
      }

      expect(messages.pageKind.concept).toBeTruthy();
      expect(messages.pageKind.guide).toBeTruthy();
      expect(messages.pageKind.technique).toBeTruthy();
      expect(messages.pageKind.documentation).toBeTruthy();
      expect(messages.pageKind.glossary).toBeTruthy();
      expect(messages.pageKind.blog).toBeTruthy();
      expect(messages.pageKind.module).toBeUndefined();
      expect(messages.pageKind.model).toBeUndefined();
      expect(messages.pageKind.paper).toBeUndefined();
      expect(messages.pageKind.training).toBeUndefined();
      expect(messages.tagCategories["module-type"]).toBeUndefined();
      expect(messages.tagCategories["paper-topic"]).toBeUndefined();
      expect(messages.tagCategories["model-family"]).toBeUndefined();
      expect(messages.tagCategories.training).toBeUndefined();

      // Idle/sidebar/search metadata should invite factory collections, not
      // retired Atlas product surfaces, without scanning source files.
      expect(messages.search.idle).not.toMatch(retiredSurfaceInvite);
      expect(messages.shell.sidebarDescription).not.toMatch(
        retiredSurfaceInvite,
      );
      expect(messages.searchEntry.description).toMatch(
        /you-agent-factory|ガイド|指南|hướng dẫn|guides|concepts|techniques|documentation|glossary/i,
      );
      expect(messages.searchEntry.emptySuggestionTerm).not.toMatch(
        /GQA|attention/i,
      );
      expect(messages.searchEntry.emptySuggestionLinkLabel).not.toMatch(
        /GQA|attention|アテンション|注意力/i,
      );
      expect(messages.searchEntry.emptySuggestionTerm).toBe("harness");
    }
  });

  it("includes zh-CN language selector labels across shipped shell locales", async () => {
    for (const locale of ["en", "ja", "zh-CN", "vi"] as const) {
      const messages = await loadUiMessages(locale);
      expect(messages.language.locales["zh-CN"]).toBe("简体中文");
    }
  });

  it("fails closed when shipped vietnamese shared UI messages are missing", async () => {
    await mkdir(join(tempMessagesRoot, "en"), { recursive: true });
    await writeFile(
      join(tempMessagesRoot, "en", "common.json"),
      JSON.stringify({
        nav: { home: "Home" },
      }),
    );

    expect(() =>
      loadUiMessagesFromDisk("vi", { messagesRoot: tempMessagesRoot }),
    ).toThrow(UiMessagesLoadError);
    expect(() =>
      loadUiMessagesFromDisk("vi", { messagesRoot: tempMessagesRoot }),
    ).toThrow(/Missing required UI messages file for locale "vi"/);
  });

  it("exposes every compatibility top-level message group", async () => {
    const messages = await loadUiMessages();
    for (const key of UI_MESSAGES_COMPATIBILITY_KEYS) {
      expect(messages[key]).toBeDefined();
    }
  });

  it("formatPageKind resolves known factory kinds and falls back for unknown kinds", async () => {
    const messages = await loadUiMessages();
    expect(formatPageKind(messages, "concept")).toBe("Concept");
    expect(formatPageKind(messages, "guide")).toBe("Guide");
    expect(formatPageKind(messages, "technique")).toBe("Technique");
    expect(formatPageKind(messages, "documentation")).toBe("Documentation");
    expect(formatPageKind(messages, "glossary")).toBe("Glossary");
    expect(formatPageKind(messages, "blog")).toBe("Blog");
    expect(formatPageKind(messages, "module")).toBe("module");
    expect(formatPageKind(messages, "not-a-real-kind")).toBe("not-a-real-kind");
  });

  it("fails closed when shipped japanese shared UI messages are missing", async () => {
    await mkdir(join(tempMessagesRoot, "en"), { recursive: true });
    await writeFile(
      join(tempMessagesRoot, "en", "common.json"),
      JSON.stringify({
        nav: { home: "Home" },
      }),
    );

    expect(() =>
      loadUiMessagesFromDisk("ja", { messagesRoot: tempMessagesRoot }),
    ).toThrow(UiMessagesLoadError);
    expect(() =>
      loadUiMessagesFromDisk("ja", { messagesRoot: tempMessagesRoot }),
    ).toThrow(/Missing required UI messages file for locale "ja"/);
  });

  it("fails closed when shipped chinese simplified shared UI messages are missing", async () => {
    await mkdir(join(tempMessagesRoot, "en"), { recursive: true });
    await writeFile(
      join(tempMessagesRoot, "en", "common.json"),
      JSON.stringify({
        nav: { home: "Home" },
      }),
    );

    expect(() =>
      loadUiMessagesFromDisk("zh-CN", { messagesRoot: tempMessagesRoot }),
    ).toThrow(UiMessagesLoadError);
    expect(() =>
      loadUiMessagesFromDisk("zh-CN", { messagesRoot: tempMessagesRoot }),
    ).toThrow(/Missing required UI messages file for locale "zh-CN"/);
  });
});

describe("message boundary contracts", () => {
  it("loads representative shell message values through loadUiMessages", async () => {
    const messages = await loadUiMessages();
    expect(messages.search.placeholder).toBe("Search you-agent-factory…");
    expect(messages.search.open).toBe("Open search");
    expect(messages.language.selectorLabel).toBe("Language");
    expect(messages.language.locales.en).toBe("English");
    expect(messages.shell.sidebarTitle).toBe("Reference");
    expect(messages.shell.onThisPage).toBe("On this page");
    expect(messages.nav.topology).toBe("Topology");
    expect(messages.nav.timeline).toBe("Timeline");
  });

  it("loads representative factory domain message values through loadUiMessages", async () => {
    const messages = await loadUiMessages();
    expect(messages.conceptsIndex.title).toBe("Concepts");
    expect(messages.guidesIndex.title).toBe("Guides");
    expect(messages.techniquesIndex.title).toBe("Techniques");
    expect(messages.documentationIndex.title).toBe("Documentation");
    expect(messages.tagLanding.searchHandoff).toBe("Search this tag");
  });

  it("assigns shell-shaped data to ShellMessages without factory domain fields", () => {
    const shellShaped: ShellMessages = {
      search: {
        open: "Open search",
        placeholder: "Search…",
        close: "Close search",
        idle: "Type to search.",
        noResults: "No results.",
        loading: "Searching…",
        error: "Search unavailable.",
        retry: "Try again",
        shortcut: "Search",
        resultPath: "Path",
      },
      nav: {
        home: "Home",
        search: "Search",
        menu: "Open menu",
        guides: "Guides",
        docs: "Docs",
        architecture: "Architecture",
        topology: "Topology",
        blog: "Blog",
        glossary: "Glossary",
        timeline: "Timeline",
        tags: "Tags",
      },
      language: {
        open: "Switch language",
        selectorLabel: "Language",
        unavailable: "Not available",
        locales: { en: "English" },
      },
      shell: {
        sidebarTitle: "Reference",
        sidebarDescription: "Browse modules.",
        onThisPage: "On this page",
        openingSummary: "Opening summary",
      },
    };

    expect(acceptsShellMessages(shellShaped)).toBe(shellShaped);
    expect("conceptsIndex" in shellShaped).toBe(false);
    expect("tagsIndex" in shellShaped).toBe(false);
  });

  it("distinguishes FactoryDomainMessages from shell-only message groups", async () => {
    const messages = await loadUiMessages();
    const shellOnly = pickShellMessages(messages);
    const factoryDomain = pickFactoryDomainMessages(messages);

    expect(acceptsShellMessages(shellOnly)).toBe(shellOnly);
    expect(acceptsFactoryDomainMessages(factoryDomain)).toBe(factoryDomain);

    for (const shellKey of SHELL_MESSAGE_KEYS) {
      expect(shellKey in factoryDomain).toBe(false);
    }
    for (const domainKey of FACTORY_DOMAIN_MESSAGE_KEYS) {
      expect(domainKey in shellOnly).toBe(false);
    }

    const boundaryKeys = new Set([
      ...SHELL_MESSAGE_KEYS,
      ...DOCS_MESSAGE_KEYS,
      ...FACTORY_DOMAIN_MESSAGE_KEYS,
    ]);
    expect(boundaryKeys.size).toBe(
      SHELL_MESSAGE_KEYS.length +
        DOCS_MESSAGE_KEYS.length +
        FACTORY_DOMAIN_MESSAGE_KEYS.length,
    );
    for (const key of UI_MESSAGES_COMPATIBILITY_KEYS) {
      expect(boundaryKeys.has(key)).toBe(true);
    }
  });
});
