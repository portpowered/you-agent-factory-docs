import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, screen, within } from "@testing-library/react";
import { act } from "react";
import {
  renderBlogIndexPage,
  renderBlogPostPage,
} from "@/app/(site)/site-renderers";
import { CanonicalDocsLayout } from "@/components/layout/canonical-docs-layout";
import { getPrimaryNavItems } from "@/components/layout/primary-nav";
import {
  expectCriticalPageStructure,
  listKeyboardFocusableControls,
} from "@/lib/verify/a11y-page-structure";
import { expectNoSeriousAxeViolations } from "@/tests/a11y/axe";
import {
  captureOriginalFetch,
  installDocsSearchFetchMock,
  loadAppTestContext,
  renderWithAppProviders,
  restoreFetchMock,
} from "@/tests/a11y/render";

const REPRESENTATIVE_BLOG_POST_SLUG = "comparing-agent-factories";
const REPRESENTATIVE_BLOG_POST_TITLE =
  "Comparing agent factories and orchestration systems";

describe("blog accessibility", () => {
  beforeAll(() => {
    captureOriginalFetch();
  });

  afterEach(() => {
    cleanup();
    restoreFetchMock();
  });

  test("blog index exposes landmarks, headings, labeled post links, and no serious axe violations", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderBlogIndexPage();

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: context.messages.blogIndex.title,
    });
    expect(structure.headingLevels[0]).toBe(1);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of getPrimaryNavItems(context.messages)) {
      const link = within(nav).getByRole("link", { name: item.label });
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.className).toContain("focus-visible:ring");
    }

    const searchButton = screen.getByRole("button", {
      name: context.messages.search.open,
    });
    searchButton.focus();
    expect(document.activeElement).toBe(searchButton);

    const postList = screen.getByRole("list", {
      name: context.messages.blogIndex.listLabel,
    });
    expect(postList).toBeTruthy();

    const comparingLink = screen.getByRole("link", {
      name: `Read blog post: ${REPRESENTATIVE_BLOG_POST_TITLE}`,
    });
    comparingLink.focus();
    expect(document.activeElement).toBe(comparingLink);
    expect(comparingLink.getAttribute("href")).toContain(
      `/blog/${REPRESENTATIVE_BLOG_POST_SLUG}`,
    );

    const bottlenecksLink = screen.getByRole("link", {
      name: /Read blog post: Factory bottlenecks/,
    });
    expect(bottlenecksLink.getAttribute("href")).toContain("/blog/bottlenecks");

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);

    await expectNoSeriousAxeViolations(document.body);
  });

  test("representative blog post exposes landmarks, headings, keyboard chrome, and no serious axe violations", async () => {
    await installDocsSearchFetchMock();
    const context = await loadAppTestContext();
    const page = await renderBlogPostPage(REPRESENTATIVE_BLOG_POST_SLUG);

    await act(async () => {
      await renderWithAppProviders(
        <CanonicalDocsLayout messages={context.messages}>
          {page}
        </CanonicalDocsLayout>,
        { context },
      );
    });

    const structure = expectCriticalPageStructure(document, {
      expectedH1: REPRESENTATIVE_BLOG_POST_TITLE,
    });
    expect(structure.headingLevels[0]).toBe(1);
    expect(structure.headingLevels).toContain(2);
    expect(
      screen.getByRole("heading", { level: 2, name: "Summary" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Why a lightweight agent factory exists",
      }),
    ).toBeTruthy();

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of getPrimaryNavItems(context.messages)) {
      const link = within(nav).getByRole("link", { name: item.label });
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.className).toContain("focus-visible:ring");
    }

    const searchButton = screen.getByRole("button", {
      name: context.messages.search.open,
    });
    searchButton.focus();
    expect(document.activeElement).toBe(searchButton);

    const article = document.querySelector(
      `article[data-blog-slug="${REPRESENTATIVE_BLOG_POST_SLUG}"]`,
    );
    expect(article).toBeTruthy();

    const comparisonTable = screen.getByRole("table", {
      name: "Comparison of agent factories and orchestration systems",
    });
    expect(comparisonTable).toBeTruthy();

    expect(screen.queryByTestId("blog-related-docs")).toBeNull();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Related reference pages",
      }),
    ).toBeNull();

    const bodyDocsLink = screen.getByRole("link", {
      name: "What is you-agent-factory",
    });
    bodyDocsLink.focus();
    expect(document.activeElement).toBe(bodyDocsLink);

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);

    await expectNoSeriousAxeViolations(document.body);
  });
});
