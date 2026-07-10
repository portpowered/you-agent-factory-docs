import { describe, expect, test } from "bun:test";
import {
  loadLocalDocsPage,
  parseLocalDocsPageRef,
} from "@/lib/content/local-docs-page";

describe("local docs page TOC", () => {
  test("loop concept page exposes section heading anchors in TOC order", async () => {
    const page = await loadLocalDocsPage({
      section: "concepts",
      slug: "loop",
    });

    expect(page.toc.length).toBeGreaterThan(0);
    expect(page.toc[0]).toEqual({
      title: "What It Is",
      url: "#what-it-is",
      depth: 2,
    });
    expect(page.toc.some((item) => item.url === "#why-it-matters")).toBe(true);
    expect(page.toc.some((item) => item.title === "References")).toBe(true);
  });

  test("retired Atlas sections are not loadable via local-docs dispatch", () => {
    expect(
      parseLocalDocsPageRef(["modules", "grouped-query-attention"]),
    ).toBeNull();
    expect(parseLocalDocsPageRef(["models", "gpt-2"])).toBeNull();
    expect(
      parseLocalDocsPageRef(["papers", "attention-is-all-you-need"]),
    ).toBeNull();
    expect(
      parseLocalDocsPageRef(["training", "instruction-tuning"]),
    ).toBeNull();
    expect(parseLocalDocsPageRef(["systems", "vllm"])).toBeNull();
  });
});
