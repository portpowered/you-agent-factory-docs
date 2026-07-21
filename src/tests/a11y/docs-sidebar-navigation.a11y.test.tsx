import "./mock-navigation";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, within } from "@testing-library/react";
import { act } from "react";
import { CanonicalDocsLayout } from "@/features/layout/canonical-docs-layout";
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

  async function openExplorerFolder(
    container: HTMLElement,
    folderName: string,
  ): Promise<void> {
    const folders = within(container).getAllByRole("button", {
      name: folderName,
    });
    // Top-level explorer folders follow Program documentation in DOM order.
    // Prefer the last match when names collide with other chrome controls.
    const folder = folders.at(-1);
    if (!folder) {
      throw new Error(`missing folder button ${folderName}`);
    }
    await act(async () => {
      folder.click();
    });
  }

  async function openNestedProgramDocumentationSecondaries(
    container: HTMLElement,
    messages: Awaited<ReturnType<typeof loadUiMessages>>,
  ): Promise<void> {
    // Open live Program documentation Configuring secondary.
    for (const folderName of [
      messages.explorer.documentationSecondaries.configuring,
    ] as const) {
      const folders = within(container).queryAllByRole("button", {
        name: folderName,
      });
      const folder = folders[0];
      if (!folder) {
        continue;
      }
      await act(async () => {
        folder.click();
      });
    }
  }

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
    expect(
      within(sidebar).queryByRole("link", { name: "You Agent Factory" }),
    ).toBeNull();
    expect(within(sidebar).queryByRole("link", { name: "YOU" })).toBeNull();
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
      context.messages.explorer.folders.references,
    ] as const) {
      await openExplorerFolder(sidebar, folderName);
    }
    for (const folderName of [
      context.messages.explorer.folders.factories,
      context.messages.explorer.folders.workers,
      context.messages.explorer.folders.workstations,
    ] as const) {
      await openExplorerFolder(sidebar, folderName);
    }
    await openNestedProgramDocumentationSecondaries(sidebar, context.messages);

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
      within(sidebar)
        .getAllByRole("link", { name: "API" })
        .some((link) => link.getAttribute("href") === "/docs/references/api"),
    ).toBe(true);
    expect(
      within(sidebar)
        .getAllByRole("link", { name: "Configuration" })
        .some(
          (link) =>
            link.getAttribute("href") === "/docs/factories/configuration",
        ),
    ).toBe(true);
    expect(
      within(sidebar)
        .getByRole("link", { name: "Agent worker" })
        .getAttribute("href"),
    ).toBe("/docs/workers/agent");
    expect(
      within(sidebar)
        .getByRole("link", { name: "Inference-run workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/inference-run");
    expect(
      within(sidebar).queryByRole("link", {
        name: "submitWorkBySessionId",
      }),
    ).toBeNull();

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
      within(sidebar).queryByRole("link", {
        name: "Install you-agent-factory",
      }),
    ).toBeNull();

    for (const subgroup of [
      context.messages.explorer.documentationGroups.orientation,
      context.messages.explorer.documentationGroups.capabilities,
      context.messages.explorer.documentationGroups.interfaces,
      context.messages.explorer.documentationGroups.operations,
    ] as const) {
      expect(within(sidebar).getByText(subgroup)).toBeTruthy();
    }
    expect(
      within(sidebar).getByRole("link", {
        name: "Packaged documents",
      }),
    ).toBeTruthy();
    expect(
      within(sidebar).getByRole("link", {
        name: "What is you-agent-factory",
      }),
    ).toBeTruthy();

    const orientationLabel =
      context.messages.explorer.documentationGroups.orientation;
    const capabilitiesLabel =
      context.messages.explorer.documentationGroups.capabilities;
    const interfacesLabel =
      context.messages.explorer.documentationGroups.interfaces;
    const operationsLabel =
      context.messages.explorer.documentationGroups.operations;
    const orientationSeparator = within(sidebar).getByText(orientationLabel);
    const capabilitiesSeparator = within(sidebar).getByText(capabilitiesLabel);
    const interfacesSeparator = within(sidebar).getByText(interfacesLabel);
    const operationsSeparator = within(sidebar).getByText(operationsLabel);
    const whatIsLink = within(sidebar).getByRole("link", {
      name: "What is you-agent-factory",
    });
    const cliLink = within(sidebar)
      .getAllByRole("link", { name: "CLI" })
      .find((link) => link.getAttribute("href") === "/docs/documentation/cli");
    expect(cliLink).toBeTruthy();
    if (!cliLink) {
      throw new Error("expected Interfaces CLI under Program documentation");
    }
    const replaysLink = within(sidebar).getByRole("link", {
      name: "Replays / Records",
    });
    expect(replaysLink.getAttribute("href")).toBe(
      "/docs/documentation/replays-records",
    );

    const position = (node: Element) => {
      const nodes = Array.from(sidebar.querySelectorAll("*"));
      return nodes.indexOf(node);
    };
    expect(position(orientationSeparator)).toBeLessThan(position(whatIsLink));
    expect(position(whatIsLink)).toBeLessThan(position(capabilitiesSeparator));
    expect(position(capabilitiesSeparator)).toBeLessThan(position(replaysLink));
    expect(position(interfacesSeparator)).toBeLessThan(position(cliLink));
    expect(position(cliLink)).toBeLessThan(position(operationsSeparator));

    const configuringSecondary = within(sidebar).getByRole("button", {
      name: context.messages.explorer.documentationSecondaries.configuring,
    });

    const resourcesLink = within(sidebar).getByRole("link", {
      name: "Resources",
    });
    expect(resourcesLink.getAttribute("href")).toBe(
      "/docs/documentation/resources",
    );
    expect(
      within(sidebar).queryByRole("link", { name: "Mock workers" }),
    ).toBeNull();
    expect(
      within(sidebar).queryByRole("link", { name: "Throttling and limits" }),
    ).toBeNull();
    const logsLink = within(sidebar).getByRole("link", { name: "Logs" });
    expect(logsLink.getAttribute("href")).toBe("/docs/documentation/logs");
    const metricsLink = within(sidebar).getByRole("link", { name: "Metrics" });
    expect(metricsLink.getAttribute("href")).toBe(
      "/docs/documentation/metrics",
    );

    expect(position(operationsSeparator)).toBeLessThan(
      position(configuringSecondary),
    );
    expect(position(configuringSecondary)).toBeLessThan(
      position(resourcesLink),
    );
    expect(position(resourcesLink)).toBeLessThan(position(logsLink));
    expect(position(logsLink)).toBeLessThan(position(metricsLink));

    const faqLink = within(sidebar).getByRole("link", { name: "FAQ" });
    expect(faqLink.getAttribute("href")).toBe("/docs/documentation/faq");
    faqLink.focus();
    expect(document.activeElement).toBe(faqLink);

    const programDocumentationFolder = within(sidebar).getAllByRole("button", {
      name: context.messages.explorer.folders.documentation,
    })[0];
    expect(programDocumentationFolder).toBeTruthy();
    if (!programDocumentationFolder) {
      throw new Error("expected Program documentation folder");
    }
    expect(position(programDocumentationFolder)).toBeLessThan(
      position(faqLink),
    );
    for (const former of [
      "Basics",
      "Feature support",
      "Functions",
      "Operational",
      "Additional reference",
      "System feature set",
      "Factory Configuration",
      "System Operations",
    ] as const) {
      expect(within(sidebar).queryByText(former)).toBeNull();
    }
    expect(configuringSecondary.getAttribute("aria-expanded")).not.toBe(
      "false",
    );
    expect(position(faqLink)).toBeGreaterThan(position(configuringSecondary));
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

    const homeBrandLink = within(sidebar).queryByRole("link", {
      name: "You Agent Factory",
    });
    const youBrandLink = within(sidebar).queryByRole("link", {
      name: "YOU",
    });
    expect(homeBrandLink).toBeNull();
    expect(youBrandLink).toBeNull();

    expect(sidebar.getAttribute("aria-label")).toBe(
      context.messages.shell.sidebarTitle,
    );

    for (const folderName of [
      context.messages.explorer.folders.guides,
      context.messages.explorer.folders.concepts,
      context.messages.explorer.folders.techniques,
      context.messages.explorer.folders.documentation,
    ] as const) {
      await openExplorerFolder(sidebar, folderName);
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
        context.messages.explorer.documentationGroups.orientation,
      ),
    ).toBeTruthy();
    expect(
      within(sidebar).getByText(
        context.messages.explorer.documentationGroups.operations,
      ),
    ).toBeTruthy();
    const configuringButton = within(sidebar).queryByRole("button", {
      name: context.messages.explorer.documentationSecondaries.configuring,
    });
    if (configuringButton) {
      expect(configuringButton).toBeTruthy();
    }
    expect(
      within(sidebar).queryByRole("link", { name: "Mock workers" }),
    ).toBeNull();

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

  test("keyboard focus reaches FAQ and a Concepts subgroup page with localized accessible names", async () => {
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
    expect(
      within(sidebar).queryByRole("button", { name: "Glossary" }),
    ).toBeNull();

    const programDocumentationFolder = within(sidebar).getByRole("button", {
      name: context.messages.explorer.folders.documentation,
    });
    expect(
      programDocumentationFolder.getAttribute("aria-expanded"),
    ).toBeTruthy();

    const conceptsFolder = within(sidebar).getByRole("button", {
      name: context.messages.explorer.folders.concepts,
    });
    conceptsFolder.focus();
    expect(document.activeElement).toBe(conceptsFolder);
    await act(async () => {
      conceptsFolder.click();
    });

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

    const harnessLink = within(sidebar).getByRole("link", { name: "Harness" });
    expect(harnessLink.getAttribute("href")).toBe(HARNESS_CONCEPT_URL);
    harnessLink.focus();
    expect(document.activeElement).toBe(harnessLink);

    const faqLink = within(sidebar).getByRole("link", { name: "FAQ" });
    expect(faqLink.getAttribute("href")).toBe("/docs/documentation/faq");
    faqLink.focus();
    expect(document.activeElement).toBe(faqLink);
  });

  test("localized Vietnamese explorer keeps keyboard-reachable FAQ and Concepts page with locale accessible names", async () => {
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

    expect(sidebar.getAttribute("aria-label")).toBe(
      context.messages.shell.sidebarTitle,
    );

    const conceptsFolder = within(sidebar).getByRole("button", {
      name: context.messages.explorer.folders.concepts,
    });
    const documentationFolder = within(sidebar).getByRole("button", {
      name: context.messages.explorer.folders.documentation,
    });
    expect(
      within(sidebar).queryByRole("button", { name: "Glossary" }),
    ).toBeNull();
    expect(
      within(sidebar).queryByRole("button", { name: "Program documentation" }),
    ).toBeNull();

    conceptsFolder.focus();
    expect(document.activeElement).toBe(conceptsFolder);
    await act(async () => {
      conceptsFolder.click();
    });
    documentationFolder.focus();
    expect(document.activeElement).toBe(documentationFolder);

    const harnessLink = within(sidebar).getByRole("link", { name: "Harness" });
    expect(harnessLink.getAttribute("href")).toBe("/vi/docs/concepts/harness");
    harnessLink.focus();
    expect(document.activeElement).toBe(harnessLink);

    const faqLink = within(sidebar).getByRole("link", { name: "FAQ" });
    expect(faqLink.getAttribute("href")).toBe("/vi/docs/documentation/faq");
    faqLink.focus();
    expect(document.activeElement).toBe(faqLink);
  });
});
