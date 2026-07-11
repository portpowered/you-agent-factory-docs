import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, within } from "@testing-library/react";
import { act } from "react";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { type SiteLocale, supportedLocales } from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import {
  buildExplorerTreeSignature,
  type ExplorerTreeSignature,
  folderSignatureByName,
  pageEntriesInFolder,
  pageEntriesUnderSeparator,
  separatorNamesInFolder,
  topLevelFolderNames,
  topLevelPageEntries,
} from "@/lib/navigation/explorer-tree-signature";
import { source } from "@/lib/source";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";
import "@/tests/a11y/mock-navigation";

/** Representative R01 pages that must appear in both desktop and mobile explorers. */
const R01_EXPLORER_MEMBERSHIP_SLUGS = [
  "mock-workers",
  "throttling-and-limits",
  "script-workers",
  "poller-workers",
  "agent-workers",
  "inference-workers",
  "packaged-documents",
  "packaged-factories",
] as const;

async function localizedExplorerSignature(locale: SiteLocale): Promise<{
  messages: Awaited<ReturnType<typeof loadUiMessages>>;
  signature: ExplorerTreeSignature;
}> {
  const messages = await loadUiMessages(locale);
  const tree = localizePageTree(source.pageTree, locale, { messages });
  return { messages, signature: buildExplorerTreeSignature(tree) };
}

async function openCollectionFolders(
  container: HTMLElement,
  folderNames: readonly string[],
): Promise<void> {
  for (const folderName of folderNames) {
    const folder = within(container).getByRole("button", { name: folderName });
    await act(async () => {
      folder.click();
    });
  }
}

function collectDocsExplorerLinks(
  container: HTMLElement,
): Array<{ name: string; href: string }> {
  const primaryNav = within(container).queryByRole("navigation", {
    name: "Primary",
  });
  const primaryHrefs = new Set(
    primaryNav
      ? within(primaryNav)
          .getAllByRole("link")
          .map((link) => link.getAttribute("href") ?? "")
      : [],
  );

  return within(container)
    .getAllByRole("link")
    .map((link) => ({
      name: link.textContent?.trim() ?? "",
      href: link.getAttribute("href") ?? "",
    }))
    .filter(
      (link) =>
        link.href.includes("/docs/") &&
        link.name.length > 0 &&
        // Mobile drawer also hosts primary-nav destinations above the explorer.
        !primaryHrefs.has(link.href),
    );
}

function collectFolderButtonNames(container: HTMLElement): string[] {
  return within(container)
    .getAllByRole("button")
    .map((button) => button.textContent?.trim() ?? "")
    .filter((name) => name.length > 0);
}

describe("desktop/mobile explorer tree parity", () => {
  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("localized constructed trees share FAQ placement, folder order, and subgroup membership for every locale", async () => {
    for (const locale of supportedLocales) {
      const { messages, signature } = await localizedExplorerSignature(locale);

      expect(signature.rootName).toBe("You Agent Factory");
      expect(topLevelFolderNames(signature)).toEqual([
        messages.explorer.folders.guides,
        messages.explorer.folders.concepts,
        messages.explorer.folders.techniques,
        messages.explorer.folders.documentation,
      ]);
      expect(topLevelFolderNames(signature)).not.toContain("Glossary");

      const faqEntries = topLevelPageEntries(signature);
      expect(faqEntries).toHaveLength(1);
      expect(faqEntries[0]?.url).toMatch(/\/docs\/documentation\/faq$/);
      expect(signature.children.at(-1)).toMatchObject({
        type: "page",
        url: faqEntries[0]?.url,
      });

      const concepts = folderSignatureByName(
        signature,
        messages.explorer.folders.concepts,
      );
      expect(concepts).toBeTruthy();
      if (!concepts) {
        throw new Error(`expected Concepts folder for ${locale}`);
      }
      expect(separatorNamesInFolder(concepts)).toEqual([
        messages.explorer.conceptsGroups.harnesses,
        messages.explorer.conceptsGroups["industrial-engineering"],
        messages.explorer.conceptsGroups["model-inference"],
      ]);
      expect(pageEntriesInFolder(concepts).length).toBeGreaterThan(0);

      const documentation = folderSignatureByName(
        signature,
        messages.explorer.folders.documentation,
      );
      expect(documentation).toBeTruthy();
      if (!documentation) {
        throw new Error(`expected Program documentation folder for ${locale}`);
      }
      const documentationSeparators = separatorNamesInFolder(documentation);
      expect(documentationSeparators[0]).toBe(
        messages.explorer.documentationGroups.basics,
      );
      expect(documentationSeparators.at(-1)).toBe(
        messages.explorer.documentationGroups["additional-reference"],
      );
      expect(
        pageEntriesInFolder(documentation).some((page) =>
          page.url.endsWith("/docs/documentation/faq"),
        ),
      ).toBe(false);

      for (const slug of R01_EXPLORER_MEMBERSHIP_SLUGS) {
        expect(
          pageEntriesInFolder(documentation).some((page) =>
            page.url.includes(`/documentation/${slug}`),
          ),
          `${locale}: ${slug} in Program documentation folder`,
        ).toBe(true);
      }

      expect(
        pageEntriesUnderSeparator(
          documentation,
          messages.explorer.documentationGroups.functions,
        ).some((page) => page.url.includes("/documentation/mock-workers")),
      ).toBe(true);
      expect(
        pageEntriesUnderSeparator(
          documentation,
          messages.explorer.documentationGroups.cli,
        ).some((page) =>
          page.url.includes("/documentation/packaged-documents"),
        ),
      ).toBe(true);
    }
  });

  test("CanonicalDocsLayout desktop sidebar and mobile drawer expose the same localized explorer IA", async () => {
    captureOriginalFetch();
    await installDocsSearchFetchMock();

    for (const locale of supportedLocales) {
      const context = await loadAppTestContext(locale);
      const { signature } = await localizedExplorerSignature(locale);
      const folderNames = topLevelFolderNames(signature);
      const faq = topLevelPageEntries(signature)[0];
      expect(faq).toBeTruthy();

      await act(async () => {
        await renderWithAppProviders(
          <CanonicalDocsLayout messages={context.messages} locale={locale}>
            <p>Fixture article</p>
          </CanonicalDocsLayout>,
          { context },
        );
      });

      const sidebar = document.getElementById("nd-sidebar");
      expect(sidebar).toBeTruthy();
      if (!sidebar) {
        throw new Error(`expected desktop sidebar for ${locale}`);
      }

      await openCollectionFolders(sidebar, folderNames);

      expect(
        within(sidebar).queryByRole("button", { name: "Glossary" }),
      ).toBeNull();
      const desktopFaq = within(sidebar).getByRole("link", {
        name: faq?.name,
      });
      expect(desktopFaq.getAttribute("href")).toBe(faq?.url);

      const conceptsFolder = folderSignatureByName(
        signature,
        context.messages.explorer.folders.concepts,
      );
      expect(conceptsFolder).toBeTruthy();
      if (!conceptsFolder) {
        throw new Error(`expected Concepts folder signature for ${locale}`);
      }
      for (const separator of separatorNamesInFolder(conceptsFolder)) {
        expect(within(sidebar).getByText(separator)).toBeTruthy();
      }

      const documentationFolder = folderSignatureByName(
        signature,
        context.messages.explorer.folders.documentation,
      );
      expect(documentationFolder).toBeTruthy();
      if (!documentationFolder) {
        throw new Error(
          `expected Program documentation folder signature for ${locale}`,
        );
      }
      expect(
        within(sidebar).getByText(
          context.messages.explorer.documentationGroups.basics,
        ),
      ).toBeTruthy();

      const desktopLinks = collectDocsExplorerLinks(sidebar);
      const desktopFolders = collectFolderButtonNames(sidebar).filter((name) =>
        folderNames.includes(name),
      );

      for (const slug of R01_EXPLORER_MEMBERSHIP_SLUGS) {
        expect(
          desktopLinks.some((link) =>
            link.href.includes(`/documentation/${slug}`),
          ),
          `${locale} desktop: ${slug}`,
        ).toBe(true);
      }

      const menuButton = within(document.body).getByRole("button", {
        name: context.messages.nav.menu,
      });
      await act(async () => {
        menuButton.click();
      });

      const drawer = document.getElementById(
        menuButton.getAttribute("aria-controls") ?? "",
      );
      expect(drawer).toBeTruthy();
      if (!drawer) {
        throw new Error(`expected mobile drawer for ${locale}`);
      }
      expect(drawer.getAttribute("role")).toBe("dialog");
      expect(drawer.getAttribute("aria-label")).toBe(
        context.messages.shell.sidebarTitle,
      );

      await openCollectionFolders(drawer, folderNames);

      expect(
        within(drawer).queryByRole("button", { name: "Glossary" }),
      ).toBeNull();
      const mobileFaq = within(drawer).getByRole("link", { name: faq?.name });
      expect(mobileFaq.getAttribute("href")).toBe(faq?.url);

      for (const separator of separatorNamesInFolder(conceptsFolder)) {
        expect(within(drawer).getByText(separator)).toBeTruthy();
      }
      expect(
        within(drawer).getByText(
          context.messages.explorer.documentationGroups.basics,
        ),
      ).toBeTruthy();

      const mobileLinks = collectDocsExplorerLinks(drawer);
      const mobileFolders = collectFolderButtonNames(drawer).filter((name) =>
        folderNames.includes(name),
      );

      expect(mobileFolders).toEqual(desktopFolders);
      expect(mobileLinks).toEqual(desktopLinks);

      for (const slug of R01_EXPLORER_MEMBERSHIP_SLUGS) {
        expect(
          mobileLinks.some((link) =>
            link.href.includes(`/documentation/${slug}`),
          ),
          `${locale} mobile: ${slug}`,
        ).toBe(true);
      }

      cleanup();
    }
  });
});
