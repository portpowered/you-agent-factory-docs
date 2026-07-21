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
 * Wave C production route flip regression: `/` (and localized home sharing
 * renderHomePage) mounts LandingPage with wired MERGED fills. HomeArticle
 * remains available for other surfaces but is not the production home
 * composition. Carousel is a real FactoryCarousel fill (production Wave B).
 */
describe("production home mounts LandingPage (Wave C route flip)", () => {
  test("renderHomePage mounts LandingPage and does not mount HomeArticle", async () => {
    const tree = (await renderHomePage()) as ReactElement;
    const types = new Set<unknown>();
    collectElementTypes(tree, types);

    expect(types.has(LandingPage)).toBe(true);
    expect(types.has(HomeArticle)).toBe(false);
  });

  test("localized renderHomePage shares the LandingPage composition", async () => {
    const tree = (await renderHomePage("vi")) as ReactElement;
    const types = new Set<unknown>();
    collectElementTypes(tree, types);

    expect(types.has(LandingPage)).toBe(true);
    expect(types.has(HomeArticle)).toBe(false);

    const landingPage = findElementOfType(tree, LandingPage);
    expect(landingPage).not.toBeNull();
    const html = renderToStaticMarkup(landingPage as ReactElement);
    expect(html).toContain('data-landing-page=""');
  });

  test("production home exposes wired landing markers including FactoryCarousel", async () => {
    const tree = (await renderHomePage()) as ReactElement;
    const landingPage = findElementOfType(tree, LandingPage);
    expect(landingPage).not.toBeNull();

    const html = renderToStaticMarkup(landingPage as ReactElement);

    // Root + wired MERGED slots (header / hero+sphere / capability / youi /
    // carousel / whale / footer).
    expect(html).toContain('data-landing-page=""');
    expect(html).toContain('data-landing-main=""');
    expect(html).toContain("<main");
    expect(html).toContain('data-landing-header=""');
    expect(html).toContain('data-hero-section=""');
    expect(html).toContain('data-particle-sphere=""');
    expect(html).toContain('data-capability-strip=""');
    expect(html).toContain('data-youi-showcase=""');
    expect(html).toContain('data-factory-carousel=""');
    expect(html).toContain('data-whale-bubbles-section=""');
    expect(html).toContain('data-testid="site-footer"');
    expect(html).toContain('data-landing-footer-art=""');
    expect(html).not.toContain('data-landing-placeholder="carousel"');

    // Reject docs-home composition and harness-only hero surface.
    expect(html).not.toContain(
      `data-content-column-surface="${HOME_ARTICLE_CONTENT_COLUMN_SURFACE}"`,
    );
    expect(html).not.toContain('data-landing-harness-hero=""');
    expect(html).not.toContain('data-landing-placeholder="header"');
    expect(html).not.toContain('data-landing-placeholder="hero"');
    expect(html).not.toContain('data-landing-placeholder="footer"');
  });
});
