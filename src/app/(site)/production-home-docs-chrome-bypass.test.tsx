import { describe, expect, test } from "bun:test";
import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SiteDocsChromeLayout from "@/app/(site)/(with-docs-chrome)/layout";
import SiteLayout from "@/app/(site)/layout";
import LocalizedDocsChromeLayout from "@/app/[locale]/(with-docs-chrome)/layout";
import LocalizedLayout from "@/app/[locale]/layout";
import { CanonicalDocsLayout } from "@/features/layout/canonical-docs-layout";

function collectElementTypes(node: ReactNode, out: Set<unknown>): void {
  if (!isValidElement(node)) {
    return;
  }

  out.add(node.type);

  const { children } = node.props as { children?: ReactNode };
  if (Array.isArray(children)) {
    for (const child of children) {
      collectElementTypes(child, out);
    }
    return;
  }

  collectElementTypes(children, out);
}

/**
 * Wave C story 003: production `/` (and localized home) omit CanonicalDocsLayout;
 * non-home site routes keep docs chrome via `(with-docs-chrome)`.
 */
describe("production home bypasses docs chrome (Wave C)", () => {
  test("default site layout does not mount CanonicalDocsLayout", async () => {
    const tree = (await SiteLayout({
      children: <div data-home-fixture="">home</div>,
    })) as ReactElement;
    const types = new Set<unknown>();
    collectElementTypes(tree, types);

    expect(types.has(CanonicalDocsLayout)).toBe(false);

    const html = renderToStaticMarkup(tree);
    expect(html).not.toContain('id="nd-sidebar"');
    expect(html).toContain('data-home-fixture=""');
  });

  test("localized layout does not mount CanonicalDocsLayout", async () => {
    const tree = (await LocalizedLayout({
      children: <div data-home-fixture="">home</div>,
      params: Promise.resolve({ locale: "vi" }),
    })) as ReactElement;
    const types = new Set<unknown>();
    collectElementTypes(tree, types);

    expect(types.has(CanonicalDocsLayout)).toBe(false);

    const html = renderToStaticMarkup(tree);
    expect(html).not.toContain('id="nd-sidebar"');
    expect(html).toContain('data-home-fixture=""');
  });

  test("site (with-docs-chrome) layout mounts CanonicalDocsLayout", async () => {
    const tree = (await SiteDocsChromeLayout({
      children: <div data-docs-fixture="">docs</div>,
    })) as ReactElement;
    const types = new Set<unknown>();
    collectElementTypes(tree, types);

    expect(types.has(CanonicalDocsLayout)).toBe(true);
  });

  test("localized (with-docs-chrome) layout mounts CanonicalDocsLayout", async () => {
    const tree = (await LocalizedDocsChromeLayout({
      children: <div data-docs-fixture="">docs</div>,
      params: Promise.resolve({ locale: "vi" }),
    })) as ReactElement;
    const types = new Set<unknown>();
    collectElementTypes(tree, types);

    expect(types.has(CanonicalDocsLayout)).toBe(true);
  });
});
