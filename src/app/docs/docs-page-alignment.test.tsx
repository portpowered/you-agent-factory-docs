import { afterEach, describe, expect, setDefaultTimeout, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { act } from "react";
import {
  DOCS_PAGE_CONTENT_COLUMN_SURFACE,
  renderDocsSlugPage,
} from "@/app/docs/docs-slug-renderer";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS } from "@/components/layout/docs-header";
import {
  CONTENT_COLUMN_CONSUMER_SURFACES,
  CONTENT_COLUMN_INSET,
  CONTENT_COLUMN_INSET_CLASS,
} from "@/lib/layout/content-column-alignment";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

setDefaultTimeout(15_000);

describe("normal docs page content-column alignment", () => {
  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("registers docs-page as a shared content-column consumer", () => {
    expect(CONTENT_COLUMN_CONSUMER_SURFACES).toContain(
      DOCS_PAGE_CONTENT_COLUMN_SURFACE,
    );
    expect(DOCS_PAGE_CONTENT_COLUMN_SURFACE).toBe("docs-page");
  });

  test("header nav and docs page share the same content-column inset contract", () => {
    expect(DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS).toContain(
      CONTENT_COLUMN_INSET_CLASS,
    );
    expect(CONTENT_COLUMN_INSET_CLASS).toBe("px-4 md:px-6 xl:px-8");
    expect(CONTENT_COLUMN_INSET.mobile).toBe("1rem");
    expect(CONTENT_COLUMN_INSET.md).toBe("1.5rem");
    expect(CONTENT_COLUMN_INSET.xl).toBe("2rem");
  });

  test("representative docs page content column shares DocsPage left edge without negative-margin compensation", async () => {
    captureOriginalFetch();
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderDocsSlugPage(["concepts", "harness"]);

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const pageEl = document.getElementById("nd-page");
    expect(pageEl).toBeTruthy();
    expect(pageEl?.getAttribute("data-content-column-surface")).toBe(
      DOCS_PAGE_CONTENT_COLUMN_SURFACE,
    );

    // Shared inset tokens live on `#nd-page` (may be non-contiguous in className).
    const pageClass = pageEl?.className ?? "";
    expect(pageClass).toContain("px-4");
    expect(pageClass).toContain("md:px-6");
    expect(pageClass).toContain("xl:px-8");
    expect(pageClass).not.toMatch(/(?:^|\s)-m[trblxy]?-/);

    // Header primary nav uses the same inset contract.
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    const navColumn = primaryNav.firstElementChild;
    expect(navColumn?.className ?? "").toContain(CONTENT_COLUMN_INSET_CLASS);

    expect(
      screen.getByRole("heading", { level: 1, name: "Harness" }),
    ).toBeTruthy();

    const article = document.querySelector(
      "article[data-registry-id]",
    ) as HTMLElement | null;
    expect(article).toBeTruthy();
    expect(article?.getAttribute("data-registry-id")).toBe("concept.harness");
    // Shell/layout only — no nested content-column inset on the article body.
    expect(article?.className ?? "").not.toContain(CONTENT_COLUMN_INSET_CLASS);
    expect(article?.className ?? "").not.toMatch(/(?:^|\s)-m[trblxy]?-/);
  });
});
