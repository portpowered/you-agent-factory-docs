import { describe, expect, test } from "bun:test";
import type { Metadata } from "next";
import { pageOpenGraph, withPageOpenGraph } from "@/lib/seo/page-open-graph";
import { DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH } from "@/lib/seo/social-preview-assets";

describe("pageOpenGraph", () => {
  test("mirrors title, description, app-relative url, and default social image", () => {
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
      images: [{ url: DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH }],
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
  test("attaches Open Graph and Twitter from title, description, and canonical", () => {
    const metadata = withPageOpenGraph({
      title: "Search",
      description: "Search you-agent-factory docs",
      alternates: { canonical: "/search" },
    });

    expect(metadata.openGraph).toEqual({
      title: "Search",
      description: "Search you-agent-factory docs",
      url: "/search",
      images: [{ url: DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH }],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      images: [DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH],
    });
    expect(metadata.alternates?.canonical).toBe("/search");
  });

  test("omits url when canonical is absent but still attaches social images", () => {
    const metadata = withPageOpenGraph({
      title: "Orphan",
      description: "No canonical yet",
    });

    expect(metadata.openGraph).toEqual({
      title: "Orphan",
      description: "No canonical yet",
      images: [{ url: DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH }],
    });
    expect(metadata.twitter?.images).toEqual([
      DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH,
    ]);
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
