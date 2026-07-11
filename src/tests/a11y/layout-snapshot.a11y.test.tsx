import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup } from "@testing-library/react";
import { act } from "react";
import { HomeArticle } from "@/components/home/home-article";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { getPrimaryNavItems } from "@/components/layout/primary-nav";
import { BrowseIndexPage } from "@/features/docs/components/BrowseIndexPage";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { buildDocsBrowseSections } from "@/lib/docs/browse-collection-sections";
import { defaultLocale } from "@/lib/i18n/locale-routing";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";
import {
  assertCriticalLayoutContract,
  captureCriticalLayoutSnapshot,
  diffLayoutSnapshots,
  expectLayoutSnapshotMatches,
  hashLayoutSnapshot,
} from "@/lib/verify/a11y-layout-snapshot";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

describe("critical layout snapshot (always-on lightweight visual equivalent)", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("home layout snapshot passes contract and fails on deliberate main regression", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <HomeArticle
            messages={context.messages}
            siteConfig={youAgentFactorySiteConfig}
          />
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const baseline = captureCriticalLayoutSnapshot(document);
    assertCriticalLayoutContract(baseline, {
      expectedH1: context.messages.home.title,
      expectedBrand: "You Agent Factory",
      expectedContentColumnSurface: "home-article-browse",
      minPrimaryNavLinks: getPrimaryNavItems(context.messages).length,
    });
    expect(baseline.brandText).toBe("You Agent Factory");
    expect(baseline.primaryNavHrefs).toEqual(
      getPrimaryNavItems(context.messages).map((item) => item.href),
    );

    // Same snapshot matches itself (good baseline).
    expectLayoutSnapshotMatches(baseline, baseline);
    const baselineHash = hashLayoutSnapshot(baseline);

    // Deliberate meaningful layout regression: strip every main landmark.
    // Capture may match `main` or `[role="main"]`; remove all so the contract
    // fails even when Fumadocs/shell chrome leaves more than one.
    for (const node of Array.from(
      document.querySelectorAll('main, [role="main"]'),
    )) {
      node.remove();
    }
    const regress = captureCriticalLayoutSnapshot(document);
    expect(() => assertCriticalLayoutContract(regress)).toThrow(
      /expected main landmark/,
    );
    expect(hashLayoutSnapshot(regress)).not.toBe(baselineHash);
    expect(diffLayoutSnapshots(baseline, regress).length).toBeGreaterThan(0);
    expect(() => expectLayoutSnapshotMatches(regress, baseline)).toThrow(
      /Layout snapshot mismatch/,
    );
  });

  test("browse layout snapshot passes contract and fails when h1 is removed", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const sections = buildDocsBrowseSections({
      pages,
      locale: defaultLocale,
      messages: context.messages,
    });

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          <h1>{context.messages.browseIndex.title}</h1>
          <p>{context.messages.browseIndex.description}</p>
          <BrowseIndexPage messages={context.messages} sections={sections} />
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const baseline = captureCriticalLayoutSnapshot(document);
    assertCriticalLayoutContract(baseline, {
      expectedH1: context.messages.browseIndex.title,
      expectedBrand: "You Agent Factory",
      minPrimaryNavLinks: getPrimaryNavItems(context.messages).length,
    });
    expect(baseline.brandText).toBe("You Agent Factory");
    expectLayoutSnapshotMatches(baseline, baseline);

    document.querySelector("h1")?.remove();
    const regress = captureCriticalLayoutSnapshot(document);
    expect(() =>
      assertCriticalLayoutContract(regress, {
        expectedH1: context.messages.browseIndex.title,
      }),
    ).toThrow(/expected at least one h1|expected h1 matching/);
    expect(hashLayoutSnapshot(regress)).not.toBe(hashLayoutSnapshot(baseline));
  });
});
