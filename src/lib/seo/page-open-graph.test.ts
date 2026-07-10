import { describe, expect, test } from "bun:test";
import type { Metadata } from "next";
import { pageOpenGraph, withPageOpenGraph } from "@/lib/seo/page-open-graph";

describe("pageOpenGraph", () => {
  test("mirrors title, description, and app-relative url", () => {
    expect(
      pageOpenGraph({
        title: "Harness",
        description: "Persistent agent workspaces",
        url: "/docs/concepts/harness",
      }),
    ).toEqual({
      title: "Harness",
      description: "Persistent agent workspaces",
      url: "/docs/concepts/harness",
    });
  });

  test("does not include Model Atlas copy when callers pass factory strings", () => {
    const og = pageOpenGraph({
      title: "you-agent-factory",
      description: "CLI documentation for installing the factory",
      url: "/",
    });
    expect(String(og.title)).not.toMatch(/Model Atlas/i);
    expect(String(og.description)).not.toMatch(/Model Atlas/i);
  });
});

describe("withPageOpenGraph", () => {
  test("attaches Open Graph from title, description, and canonical", () => {
    const metadata = withPageOpenGraph({
      title: "Search",
      description: "Search you-agent-factory docs",
      alternates: { canonical: "/search" },
    });

    expect(metadata.openGraph).toEqual({
      title: "Search",
      description: "Search you-agent-factory docs",
      url: "/search",
    });
    expect(metadata.alternates?.canonical).toBe("/search");
  });

  test("omits url when canonical is absent", () => {
    const metadata = withPageOpenGraph({
      title: "Orphan",
      description: "No canonical yet",
    });

    expect(metadata.openGraph).toEqual({
      title: "Orphan",
      description: "No canonical yet",
    });
  });

  test("reads pathname from URL canonical objects", () => {
    const metadata = withPageOpenGraph({
      title: "Blog",
      description: "A post",
      alternates: {
        canonical: new URL("https://example.com/blog/bottlenecks"),
      } as Metadata["alternates"],
    });

    expect(metadata.openGraph?.url).toBe("/blog/bottlenecks");
  });
});
