import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderTagsIndexPage } from "@/app/(site)/site-renderers";
import {
  groupTagIndexEntriesByCategory,
  loadPublishedTagIndexEntries,
  loadPublishedTagIndexGroups,
  sortTagIndexEntriesByTitle,
  type TagIndexEntry,
} from "@/lib/content/tags";
import { loadUiMessages } from "@/lib/content/ui-messages";

describe("loadPublishedTagIndexEntries", () => {
  it("returns published tag records with localized title, summary, and landing links", async () => {
    const messages = await loadUiMessages();
    const entries = await loadPublishedTagIndexEntries(messages, "en");

    const foundations = entries.find((entry) => entry.slug === "foundations");
    expect(foundations).toBeDefined();
    expect(foundations?.title).toBe("Foundations");
    expect(foundations?.url).toBe("/tags/foundations");
    expect(foundations?.categoryLabel).toBe("Architecture");
    expect(foundations?.summary.length).toBeGreaterThan(0);

    const localModels = entries.find((entry) => entry.slug === "local-models");
    expect(localModels).toBeDefined();
    expect(localModels?.title).toBe("Local models");
    expect(localModels?.url).toBe("/tags/local-models");
    expect(localModels?.categoryLabel).toBe("Inference");

    expect(
      entries.find((entry) => entry.slug === "model-family"),
    ).toBeUndefined();
    expect(entries.find((entry) => entry.slug === "inference")).toBeUndefined();
    expect(entries.find((entry) => entry.slug === "alignment")).toBeUndefined();
  });

  it("sorts tags alphabetically by title within a flat list", async () => {
    const messages = await loadUiMessages();
    const entries = await loadPublishedTagIndexEntries(messages, "en");
    for (let index = 1; index < entries.length; index += 1) {
      expect(
        entries[index - 1].title.localeCompare(entries[index].title, "en", {
          sensitivity: "base",
        }),
      ).toBeLessThanOrEqual(0);
    }
  });
});

describe("groupTagIndexEntriesByCategory", () => {
  it("groups tags by category in schema order", async () => {
    const messages = await loadUiMessages();
    const groups = await loadPublishedTagIndexGroups(messages, "en");

    expect(groups.map((group) => group.category)).toEqual([
      "architecture",
      "inference",
    ]);
    expect(groups[0]?.tags.map((tag) => tag.slug)).toEqual([
      "foundations",
      "taxonomy",
    ]);
    expect(groups[1]?.tags.map((tag) => tag.slug)).toEqual(["local-models"]);
  });

  it("sorts tags alphabetically by title inside each category group", () => {
    const entries: TagIndexEntry[] = [
      {
        slug: "kv-cache",
        title: "KV Cache",
        summary: "Key-value cache",
        url: "/tags/kv-cache",
        category: "inference",
        categoryLabel: "Inference",
      },
      {
        slug: "softmax",
        title: "Softmax",
        summary: "Normalization",
        url: "/tags/softmax",
        category: "inference",
        categoryLabel: "Inference",
      },
    ];

    const groups = groupTagIndexEntriesByCategory(entries);
    expect(groups[0]?.tags.map((tag) => tag.title)).toEqual([
      "KV Cache",
      "Softmax",
    ]);
  });
});

describe("sortTagIndexEntriesByTitle", () => {
  it("sorts entries alphabetically by title", () => {
    const entries: TagIndexEntry[] = [
      {
        slug: "local-models",
        title: "Local models",
        summary: "Local runtime",
        url: "/tags/local-models",
        category: "inference",
        categoryLabel: "Inference",
      },
      {
        slug: "foundations",
        title: "Foundations",
        summary: "Core vocabulary",
        url: "/tags/foundations",
        category: "architecture",
        categoryLabel: "Architecture",
      },
    ];

    expect(
      sortTagIndexEntriesByTitle(entries).map((entry) => entry.title),
    ).toEqual(["Foundations", "Local models"]);
  });
});

describe("tags index messages", () => {
  it("loads localized copy for the tags index page", async () => {
    const messages = await loadUiMessages();
    expect(messages.tagsIndex.title).toBe("Tags");
    expect(messages.tagsIndex.description.length).toBeGreaterThan(0);
    expect(messages.tagCategories.architecture).toBe("Architecture");
  });
});

describe("tags index page render", () => {
  it("lists factory tags with category labels and landing links without Atlas-only tags", async () => {
    const page = await renderTagsIndexPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Tags");
    expect(html).toContain("Foundations");
    expect(html).toContain('href="/tags/foundations"');
    expect(html).toContain("Taxonomy");
    expect(html).toContain('href="/tags/taxonomy"');
    expect(html).toContain("Local models");
    expect(html).toContain('href="/tags/local-models"');
    expect(html).toContain("Architecture");
    expect(html).toContain("Inference");
    expect(html).not.toContain('href="/tags/model-family"');
    expect(html).not.toContain('href="/tags/inference"');
    expect(html).not.toContain('href="/tags/alignment"');
    expect(html).not.toContain("Model family");
    expect(html).not.toContain("mt-8");
    expect(html).toContain("list-none");
    expect(html).not.toContain("list-disc");
  });

  it("renders localized vietnamese tag titles, categories, and links", async () => {
    const page = await renderTagsIndexPage("vi");
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Thẻ");
    expect(html).toContain("Nền tảng");
    expect(html).toContain('href="/vi/tags/foundations"');
    expect(html).toContain("Phân loại");
    expect(html).toContain('href="/vi/tags/taxonomy"');
    expect(html).toContain('href="/vi/tags/local-models"');
    expect(html).not.toContain('href="/vi/tags/model-family"');
    expect(html).not.toContain('href="/vi/tags/inference"');
  });
});
