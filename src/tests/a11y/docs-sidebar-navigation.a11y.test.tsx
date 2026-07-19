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

  async function openExplorerFolder(
    container: HTMLElement,
    folderName: string,
  ): Promise<void> {
    const folders = within(container).getAllByRole("button", {
      name: folderName,
    });
    // Top-level explorer folders follow Program documentation in DOM order.
    // Prefer the last match so nested secondaries (Workers / Workstations /
    // Factories) do not steal the top-level folder click.
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
    for (const folderName of [
      messages.explorer.documentationSecondaries.workers,
      messages.explorer.documentationSecondaries.workstations,
      messages.explorer.documentationSecondaries.factories,
      messages.explorer.documentationSecondaries.resources,
      messages.explorer.documentationSecondaries.observability,
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
        .getByRole("link", { name: "Inference-run type" })
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
      within(sidebar).getByRole("link", {
        name: "Install you-agent-factory",
      }),
    ).toBeTruthy();

    for (const subgroup of [
      context.messages.explorer.documentationGroups["system-feature-set"],
      context.messages.explorer.documentationGroups.interfaces,
      context.messages.explorer.documentationGroups["factory-configuration"],
      context.messages.explorer.documentationGroups["system-operations"],
      context.messages.explorer.documentationGroups["internal-architecture"],
      context.messages.explorer.documentationGroups["additional-references"],
    ] as const) {
      expect(within(sidebar).getByText(subgroup)).toBeTruthy();
    }
    // Packaged factories is both a top-group separator and a page title.
    expect(
      within(sidebar).getAllByText(
        context.messages.explorer.documentationGroups["packaged-factories"],
      ).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      within(sidebar).getByRole("link", {
        name: "What is you-agent-factory",
      }),
    ).toBeTruthy();

    // Story 003 browser proof: Interfaces + Additional references pages sit
    // under Program documentation in separator order (flat separator siblings).
    const interfacesLabel =
      context.messages.explorer.documentationGroups.interfaces;
    const additionalReferencesLabel =
      context.messages.explorer.documentationGroups["additional-references"];
    const interfacesSeparator = within(sidebar).getByText(interfacesLabel);
    const additionalReferencesSeparator = within(sidebar).getByText(
      additionalReferencesLabel,
    );
    const cliLink = within(sidebar)
      .getAllByRole("link", { name: "CLI" })
      .find((link) => link.getAttribute("href") === "/docs/documentation/cli");
    expect(cliLink).toBeTruthy();
    if (!cliLink) {
      throw new Error("expected Interfaces CLI under Program documentation");
    }
    const installLink = within(sidebar).getByRole("link", {
      name: "Install you-agent-factory",
    });
    expect(installLink.getAttribute("href")).toBe(
      "/docs/documentation/install",
    );

    const position = (node: Element) => {
      const nodes = Array.from(sidebar.querySelectorAll("*"));
      return nodes.indexOf(node);
    };
    expect(position(interfacesSeparator)).toBeLessThan(position(cliLink));
    expect(position(cliLink)).toBeLessThan(
      position(additionalReferencesSeparator),
    );
    expect(position(additionalReferencesSeparator)).toBeLessThan(
      position(installLink),
    );

    // Story 004 browser proof: Factory Configuration → Workers and System
    // Operations → Observability nest published pages (not a flat dump).
    const factoryConfigurationLabel =
      context.messages.explorer.documentationGroups["factory-configuration"];
    const systemOperationsLabel =
      context.messages.explorer.documentationGroups["system-operations"];
    const factoryConfigurationSeparator = within(sidebar).getByText(
      factoryConfigurationLabel,
    );
    const systemOperationsSeparator = within(sidebar).getByText(
      systemOperationsLabel,
    );

    const workersSecondary = within(sidebar).getAllByRole("button", {
      name: context.messages.explorer.documentationSecondaries.workers,
    })[0];
    expect(workersSecondary).toBeTruthy();
    if (!workersSecondary) {
      throw new Error("expected Workers secondary under Factory Configuration");
    }
    const observabilitySecondary = within(sidebar).getByRole("button", {
      name: context.messages.explorer.documentationSecondaries.observability,
    });

    const mockWorkersLink = within(sidebar).getByRole("link", {
      name: "Mock workers",
    });
    expect(mockWorkersLink.getAttribute("href")).toBe(
      "/docs/documentation/mock-workers",
    );
    const logsLink = within(sidebar).getByRole("link", { name: "Logs" });
    expect(logsLink.getAttribute("href")).toBe("/docs/documentation/logs");
    const metricsLink = within(sidebar).getByRole("link", { name: "Metrics" });
    expect(metricsLink.getAttribute("href")).toBe(
      "/docs/documentation/metrics",
    );
    const replaysLink = within(sidebar).getByRole("link", {
      name: "Replays / Records",
    });
    expect(replaysLink.getAttribute("href")).toBe(
      "/docs/documentation/replays-records",
    );

    expect(position(factoryConfigurationSeparator)).toBeLessThan(
      position(workersSecondary),
    );
    expect(position(workersSecondary)).toBeLessThan(position(mockWorkersLink));
    expect(position(mockWorkersLink)).toBeLessThan(
      position(systemOperationsSeparator),
    );
    expect(position(systemOperationsSeparator)).toBeLessThan(
      position(observabilitySecondary),
    );
    expect(position(observabilitySecondary)).toBeLessThan(position(logsLink));
    expect(position(logsLink)).toBeLessThan(position(metricsLink));
    expect(position(replaysLink)).toBeLessThan(
      position(factoryConfigurationSeparator),
    );

    const faqLink = within(sidebar).getByRole("link", { name: "FAQ" });
    expect(faqLink.getAttribute("href")).toBe("/docs/documentation/faq");
    faqLink.focus();
    expect(document.activeElement).toBe(faqLink);

    // Story 006 browser proof: FAQ stays top-level outside Program
    // documentation; three-level groups replace the former ten-group order;
    // nested Workers / Observability secondaries stay reachable.
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
    ] as const) {
      expect(within(sidebar).queryByText(former)).toBeNull();
    }
    expect(workersSecondary.getAttribute("aria-expanded")).not.toBe("false");
    expect(observabilitySecondary).toBeTruthy();
    expect(position(faqLink)).toBeGreaterThan(position(observabilitySecondary));
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
      name: "You Agent Factory",
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
        context.messages.explorer.documentationGroups["system-feature-set"],
      ),
    ).toBeTruthy();
    expect(
      within(sidebar).getByText(
        context.messages.explorer.documentationGroups["factory-configuration"],
      ),
    ).toBeTruthy();
    expect(
      within(sidebar).getAllByRole("button", {
        name: context.messages.explorer.documentationSecondaries.workers,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      within(sidebar).getByRole("button", {
        name: context.messages.explorer.documentationSecondaries.resources,
      }),
    ).toBeTruthy();
    expect(
      within(sidebar).getByRole("button", {
        name: context.messages.explorer.documentationSecondaries.observability,
      }),
    ).toBeTruthy();
    expect(
      within(sidebar).queryByRole("button", { name: "Observability" }),
    ).toBeNull();
    expect(
      within(sidebar).queryByRole("button", { name: "Resources" }),
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
