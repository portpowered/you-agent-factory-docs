import { describe, expect, test } from "bun:test";
import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { HomeArticle } from "@/components/home/home-article";
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

/**
 * W-skeleton must not flip production `/` onto the LandingPage chassis.
 * W-integrate owns that swap; this lane only ships chassis + harness.
 */
describe("production home remains docs home (W-skeleton)", () => {
  test("renderHomePage still composes HomeArticle and does not mount LandingPage", async () => {
    const tree = (await renderHomePage()) as ReactElement;
    const types = new Set<unknown>();
    collectElementTypes(tree, types);

    expect(types.has(HomeArticle)).toBe(true);
    expect(types.has(LandingPage)).toBe(false);
  });
});
