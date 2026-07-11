import "./mock-navigation";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, within } from "@testing-library/react";
import { act } from "react";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  GETTING_STARTED_GUIDE_URL,
  HARNESS_CONCEPT_URL,
  PLACEHOLDER_SIDEBAR_DESCRIPTION,
  RALPH_TECHNIQUE_URL,
  TOKENS_CONCEPT_URL,
} from "@/lib/navigation/docs-sidebar-contract";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

describe("docs sidebar navigation accessibility", () => {
  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("CanonicalDocsLayout exposes keyboard-reachable factory sidebar links", async () => {
    captureOriginalFetch();
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <p>Fixture article</p>
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const sidebar = document.getElementById("nd-sidebar");
    expect(sidebar).toBeTruthy();
    if (!sidebar) {
      throw new Error("expected Fumadocs docs sidebar");
    }

    expect(sidebar.getAttribute("aria-label")).toBe(
      context.messages.shell.sidebarTitle,
    );
    expect(within(sidebar).queryByText(PLACEHOLDER_SIDEBAR_DESCRIPTION)).toBe(
      null,
    );
    expect(within(sidebar).queryByLabelText("Toggle Theme")).toBe(null);
    expect(sidebar.querySelector("[data-theme-toggle]")).toBe(null);

    const conceptsFolder = within(sidebar).getByRole("button", {
      name: context.messages.explorer.folders.concepts,
    });
    await act(async () => {
      conceptsFolder.click();
    });

    const techniquesFolder = within(sidebar).getByRole("button", {
      name: context.messages.explorer.folders.techniques,
    });
    await act(async () => {
      techniquesFolder.click();
    });

    const tokensLink = within(sidebar).getByRole("link", { name: "Tokens" });
    expect(tokensLink.getAttribute("href")).toBe(TOKENS_CONCEPT_URL);
    tokensLink.focus();
    expect(document.activeElement).toBe(tokensLink);

    const harnessLink = within(sidebar).getByRole("link", { name: "Harness" });
    expect(harnessLink.getAttribute("href")).toBe(HARNESS_CONCEPT_URL);
    harnessLink.focus();
    expect(document.activeElement).toBe(harnessLink);

    const ralphLink = within(sidebar).getByRole("link", { name: "Ralph" });
    expect(ralphLink.getAttribute("href")).toBe(RALPH_TECHNIQUE_URL);
    ralphLink.focus();
    expect(document.activeElement).toBe(ralphLink);
  });

  test("rendered docs sidebar shows factory collection folders and representative pages", async () => {
    captureOriginalFetch();
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <p>Fixture article</p>
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const sidebar = document.getElementById("nd-sidebar");
    expect(sidebar).toBeTruthy();
    if (!sidebar) {
      throw new Error("expected Fumadocs docs sidebar");
    }

    for (const folderName of [
      context.messages.explorer.folders.guides,
      context.messages.explorer.folders.concepts,
      context.messages.explorer.folders.techniques,
      context.messages.explorer.folders.documentation,
    ] as const) {
      const folder = within(sidebar).getByRole("button", { name: folderName });
      await act(async () => {
        folder.click();
      });
    }

    expect(
      within(sidebar).queryByRole("button", { name: "Glossary" }),
    ).toBeNull();

    expect(
      within(sidebar).getByRole("link", { name: "Getting Started" }),
    ).toBeTruthy();
    expect(
      within(sidebar)
        .getByRole("link", { name: "Getting Started" })
        .getAttribute("href"),
    ).toBe(GETTING_STARTED_GUIDE_URL);

    expect(
      within(sidebar).getByText(
        context.messages.explorer.conceptsGroups.harnesses,
      ),
    ).toBeTruthy();
    expect(
      within(sidebar).getByText(
        context.messages.explorer.conceptsGroups["industrial-engineering"],
      ),
    ).toBeTruthy();
    expect(
      within(sidebar).getByText(
        context.messages.explorer.conceptsGroups["model-inference"],
      ),
    ).toBeTruthy();
    expect(within(sidebar).queryByText("Reference Samples")).toBeNull();
    expect(within(sidebar).getByRole("link", { name: "Harness" })).toBeTruthy();
    expect(within(sidebar).getByRole("link", { name: "Ralph" })).toBeTruthy();
    expect(
      within(sidebar).getByRole("link", {
        name: "Install you-agent-factory",
      }),
    ).toBeTruthy();

    for (const subgroup of [
      context.messages.explorer.documentationGroups.basics,
      context.messages.explorer.documentationGroups["feature-support"],
      context.messages.explorer.documentationGroups.functions,
      context.messages.explorer.documentationGroups.operational,
      context.messages.explorer.documentationGroups["internal-architecture"],
      context.messages.explorer.documentationGroups["additional-reference"],
    ] as const) {
      expect(within(sidebar).getByText(subgroup)).toBeTruthy();
    }
    // Configuration / API / CLI / MCP are both subgroup separators and page titles.
    for (const sharedLabel of [
      context.messages.explorer.documentationGroups.configuration,
      context.messages.explorer.documentationGroups.api,
      context.messages.explorer.documentationGroups.cli,
      context.messages.explorer.documentationGroups.mcp,
    ] as const) {
      expect(
        within(sidebar).getAllByText(sharedLabel).length,
      ).toBeGreaterThanOrEqual(2);
    }
    expect(
      within(sidebar).getByRole("link", {
        name: "What is you-agent-factory",
      }),
    ).toBeTruthy();

    const faqLink = within(sidebar).getByRole("link", { name: "FAQ" });
    expect(faqLink.getAttribute("href")).toBe("/docs/documentation/faq");
    faqLink.focus();
    expect(document.activeElement).toBe(faqLink);
  });

  test("localized docs shell preserves locale while exposing shipped Vietnamese docs links", async () => {
    captureOriginalFetch();
    await installDocsSearchFetchMock();
    const [messages, metaMap] = await Promise.all([
      loadUiMessages("vi"),
      loadSearchResultMetaMap("vi"),
    ]);
    const context = {
      messages,
      metaByUrl: searchResultMetaMapToRecord(metaMap),
    };

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages} locale="vi">
          <p>Fixture article</p>
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const sidebar = document.getElementById("nd-sidebar");
    expect(sidebar).toBeTruthy();
    if (!sidebar) {
      throw new Error("expected Fumadocs docs sidebar");
    }

    const homeLink = within(sidebar).getByRole("link", {
      name: "you-agent-factory",
    });
    expect(homeLink.getAttribute("href")).toBe("/vi");

    expect(sidebar.getAttribute("aria-label")).toBe(
      context.messages.shell.sidebarTitle,
    );

    for (const folderName of [
      context.messages.explorer.folders.guides,
      context.messages.explorer.folders.concepts,
      context.messages.explorer.folders.techniques,
      context.messages.explorer.folders.documentation,
    ] as const) {
      const folder = within(sidebar).getByRole("button", { name: folderName });
      await act(async () => {
        folder.click();
      });
    }

    expect(
      within(sidebar).queryByRole("button", { name: "Concepts" }),
    ).toBeNull();
    expect(
      within(sidebar).queryByRole("button", { name: "Program documentation" }),
    ).toBeNull();
    expect(
      within(sidebar).getByText(
        context.messages.explorer.conceptsGroups.harnesses,
      ),
    ).toBeTruthy();
    expect(
      within(sidebar).getByText(
        context.messages.explorer.documentationGroups.basics,
      ),
    ).toBeTruthy();

    const tokensLink = within(sidebar).getByRole("link", { name: "Tokens" });
    expect(tokensLink.getAttribute("href")).toBe("/vi/docs/concepts/tokens");

    const harnessLink = within(sidebar).getByRole("link", { name: "Harness" });
    expect(harnessLink.getAttribute("href")).toBe("/vi/docs/concepts/harness");

    const ralphLink = within(sidebar).getByRole("link", { name: "Ralph" });
    expect(ralphLink.getAttribute("href")).toBe("/vi/docs/techniques/ralph");

    expect(
      within(sidebar).queryByRole("link", {
        name: "Grouped-Query Attention",
      }),
    ).toBeNull();
    expect(
      within(sidebar).queryByRole("button", { name: "Modules" }),
    ).toBeNull();
  });
});
