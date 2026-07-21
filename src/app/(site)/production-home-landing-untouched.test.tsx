import { describe, expect, test } from "bun:test";
import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  HOME_ARTICLE_CONTENT_COLUMN_SURFACE,
  HomeArticle,
} from "@/components/home/home-article";
import { LandingPage } from "@/features/landing-page/LandingPage";
import { renderHomePage } from "./site-renderers";

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

function findElementOfType(
  node: ReactNode,
  type: unknown,
): ReactElement | null {
  if (!isValidElement(node)) {
    return null;
  }

  if (node.type === type) {
    return node;
  }

  const { children } = node.props as { children?: ReactNode };
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findElementOfType(child, type);
      if (found) {
        return found;
      }
    }
    return null;
  }

  return findElementOfType(children, type);
}

/**
 * W-integrate Wave A fill wires LandingPage slots on landing-harness only.
 * Production `/` stays on DocsPage + HomeArticle until Header is also real.
 */
describe("production home remains docs home (W-integrate Wave A)", () => {
  test("renderHomePage still composes HomeArticle and does not mount LandingPage", async () => {
    const tree = (await renderHomePage()) as ReactElement;
    const types = new Set<unknown>();
    collectElementTypes(tree, types);

    expect(types.has(HomeArticle)).toBe(true);
    expect(types.has(LandingPage)).toBe(false);
  });

  test("docs-home HomeArticle markers are present without Wave A landing fills", async () => {
    const tree = (await renderHomePage()) as ReactElement;
    const homeArticle = findElementOfType(tree, HomeArticle);
    expect(homeArticle).not.toBeNull();

    // HomeArticle renders without DocsLayout; full DocsPage SSR needs layout context.
    const html = renderToStaticMarkup(homeArticle as ReactElement);

    expect(html).toContain(
      `data-content-column-surface="${HOME_ARTICLE_CONTENT_COLUMN_SURFACE}"`,
    );
    expect(html).not.toContain('data-landing-page=""');
    expect(html).not.toContain("data-landing-placeholder=");
    expect(html).not.toContain('data-testid="site-footer"');
    expect(html).not.toContain('data-whale-bubbles-section=""');
    expect(html).not.toContain('data-particle-sphere=""');
    expect(html).not.toContain('data-landing-harness-hero=""');
  });
});
