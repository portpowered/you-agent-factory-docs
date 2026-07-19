/**
 * Story converge-factory-search-navigation-004 proof: tags and browse hubs
 * list only factory-only collections and published factory destinations.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBrowseIndexPage,
  renderSectionKindIndexPage,
  renderTagLandingPage,
  renderTagsIndexPage,
} from "@/app/(site)/site-renderers";
import { TagLandingEmptyState } from "@/features/docs/tags/TagLandingEmptyState";
import {
  assertFactoryTagResourceEntries,
  assertNoDeletedAtlasTagSlug,
  assertNoDeletedAtlasTagSlugs,
  DELETED_ATLAS_TAG_SLUGS,
  FACTORY_PUBLISHED_TAG_SLUGS,
  FACTORY_TAG_CATEGORY_ORDER,
  FACTORY_TAG_RESOURCE_KIND_ORDER,
  isDeletedAtlasTagSlug,
  isFactoryTagResourceKind,
} from "@/lib/content/factory-tags-browse";
import { listTagRecords } from "@/lib/content/tag-registry-runtime";
import {
  loadTagResourceEntries,
  loadTagResourceGroups,
} from "@/lib/content/tag-resources";
import {
  loadPublishedTagIndexEntries,
  loadPublishedTagIndexGroups,
} from "@/lib/content/tags";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { DOCS_BROWSE_COLLECTION_IDS } from "@/lib/docs/browse-collection-sections";
import { DOCS_COLLECTION_IDS } from "@/lib/docs/collection-definition-contract";

const FACTORY_BROWSE_COLLECTION_IDS = [
  "guides",
  "concepts",
  "techniques",
  "documentation",
] as const;

const RETIRED_ATLAS_COLLECTION_IDS = [
  "models",
  "modules",
  "papers",
  "training",
  "systems",
] as const;

const RETIRED_ATLAS_BROWSE_LABELS = [
  "Models",
  "Modules",
  "Papers",
  "Training",
  "Systems",
  "Model Types",
  "Inference",
  "Module Components",
] as const;

const ATLAS_PRODUCT_COPY =
  /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱/i;

describe("factory tags and browse destinations", () => {
  test("factory tag/browse contracts exclude deleted Atlas tags and kinds", () => {
    expect([...FACTORY_TAG_RESOURCE_KIND_ORDER]).toEqual([
      "concept",
      "guide",
      "technique",
      "documentation",
      "glossary",
      "reference",
      "blog",
    ]);
    expect([...FACTORY_TAG_CATEGORY_ORDER]).toEqual([
      "architecture",
      "inference",
      "systems",
      "difficulty",
    ]);

    for (const slug of FACTORY_PUBLISHED_TAG_SLUGS) {
      expect(isDeletedAtlasTagSlug(slug)).toBe(false);
    }
    for (const slug of DELETED_ATLAS_TAG_SLUGS) {
      expect(isDeletedAtlasTagSlug(slug)).toBe(true);
      expect(() => assertNoDeletedAtlasTagSlug(slug)).toThrow(
        /deleted Atlas-only tag/,
      );
    }

    expect(isFactoryTagResourceKind("guide")).toBe(true);
    expect(isFactoryTagResourceKind("blog")).toBe(true);
    expect(isFactoryTagResourceKind("module")).toBe(false);
    expect(isFactoryTagResourceKind("model")).toBe(false);

    expect(() =>
      assertFactoryTagResourceEntries([
        { url: "/docs/modules/grouped-query-attention", kind: "module" },
      ]),
    ).toThrow(/deleted Atlas inventory|outside the factory tag-resource/);
    expect(() =>
      assertFactoryTagResourceEntries([
        { url: "/blog/evolution-of-diffusion", kind: "blog" },
      ]),
    ).toThrow(/deleted Atlas inventory/);
  });

  test("browse hub presents factory collections only without advertising glossary", async () => {
    expect([...DOCS_BROWSE_COLLECTION_IDS]).toEqual([
      ...FACTORY_BROWSE_COLLECTION_IDS,
    ]);
    expect([...DOCS_COLLECTION_IDS]).toContain("glossary");

    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(await renderBrowseIndexPage());

    for (const label of ["Guides", "Concepts", "Techniques", "Documentation"]) {
      expect(html).toContain(label);
    }
    for (const href of [
      "/docs/guides",
      "/docs/concepts",
      "/docs/techniques",
      "/docs/documentation",
      "/tags",
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).not.toContain('href="/docs/glossary"');

    for (const id of RETIRED_ATLAS_COLLECTION_IDS) {
      expect(html).not.toContain(`id="${id}-heading"`);
      expect(html).not.toContain(`href="/docs/${id}"`);
    }
    for (const label of RETIRED_ATLAS_BROWSE_LABELS) {
      expect(html).not.toContain(`>${label}<`);
    }
    expect(html).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(messages.browseIndex.description).not.toMatch(ATLAS_PRODUCT_COPY);
  });

  test("tags index lists only published factory tags without Atlas-only destinations", async () => {
    const messages = await loadUiMessages();
    const records = listTagRecords();
    const entries = await loadPublishedTagIndexEntries(messages, "en");
    const groups = await loadPublishedTagIndexGroups(messages, "en");
    const html = renderToStaticMarkup(await renderTagsIndexPage());

    assertNoDeletedAtlasTagSlugs(records.map((record) => record.slug));
    assertNoDeletedAtlasTagSlugs(entries.map((entry) => entry.slug));

    for (const slug of FACTORY_PUBLISHED_TAG_SLUGS) {
      expect(entries.some((entry) => entry.slug === slug)).toBe(true);
      expect(html).toContain(`href="/tags/${slug}"`);
    }
    for (const slug of DELETED_ATLAS_TAG_SLUGS) {
      expect(entries.some((entry) => entry.slug === slug)).toBe(false);
      expect(html).not.toContain(`href="/tags/${slug}"`);
    }

    const groupedSlugs = groups.flatMap((group) =>
      group.tags.map((tag) => tag.slug),
    );
    assertNoDeletedAtlasTagSlugs(groupedSlugs);
    expect(html).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(messages.tagsIndex.description).not.toMatch(ATLAS_PRODUCT_COPY);
  });

  test("tag landings list factory destinations or factory empty next-steps", async () => {
    const messages = await loadUiMessages();

    const foundationsGroups = await loadTagResourceGroups(
      "foundations",
      messages,
    );
    const foundationsEntries = await loadTagResourceEntries("foundations");
    assertFactoryTagResourceEntries(foundationsEntries);
    expect(
      foundationsGroups.some((group) =>
        group.resources.some(
          (resource) => resource.url === "/blog/bottlenecks",
        ),
      ),
    ).toBe(true);

    const foundationsHtml = renderToStaticMarkup(
      await renderTagLandingPage({
        params: Promise.resolve({ slug: "foundations" }),
      }),
    );
    expect(foundationsHtml).toContain('href="/blog/bottlenecks"');
    expect(foundationsHtml).not.toContain("/docs/modules/");
    expect(foundationsHtml).not.toContain("/docs/models/");
    for (const slug of DELETED_ATLAS_TAG_SLUGS) {
      expect(foundationsHtml).not.toContain(`/tags/${slug}`);
    }

    const emptyHtml = renderToStaticMarkup(
      await renderTagLandingPage({
        params: Promise.resolve({ slug: "taxonomy" }),
      }),
    );
    expect(emptyHtml).toContain(messages.tagLanding.emptyTitle);
    expect(emptyHtml).toContain(messages.tagLanding.emptyDescription);
    expect(emptyHtml).toContain('href="/"');
    expect(emptyHtml).toContain('href="/tags"');
    expect(emptyHtml).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(messages.tagLanding.emptyDescription).not.toMatch(
      ATLAS_PRODUCT_COPY,
    );

    const emptyStateHtml = renderToStaticMarkup(
      createElement(TagLandingEmptyState, {
        messages,
        tagSlug: "taxonomy",
        searchQuery: "taxonomy",
      }),
    );
    expect(emptyStateHtml).toContain(messages.tagLanding.emptyHomeLink);
    expect(emptyStateHtml).toContain(messages.tagLanding.emptyTagsLink);
    expect(emptyStateHtml).toContain('href="/"');
    expect(emptyStateHtml).toContain('href="/tags"');
  });

  test("empty section-index states use factory copy and factory next-step links", async () => {
    const messages = await loadUiMessages();
    // Concepts index is a stable factory collection surface for empty-state
    // copy checks after glossary index advertising keys were removed.
    const sectionMessages = messages.conceptsIndex;

    expect(sectionMessages.emptyTitle.length).toBeGreaterThan(0);
    expect(sectionMessages.emptyDescription).not.toMatch(ATLAS_PRODUCT_COPY);
    expect(sectionMessages.emptyHomeLink.length).toBeGreaterThan(0);
    expect(sectionMessages.emptyDescription).not.toMatch(
      /modules|models|papers|training|attention|GQA/i,
    );

    for (const kind of [
      "guide",
      "concept",
      "technique",
      "documentation",
    ] as const) {
      const html = renderToStaticMarkup(await renderSectionKindIndexPage(kind));
      expect(html).not.toMatch(ATLAS_PRODUCT_COPY);
      for (const id of RETIRED_ATLAS_COLLECTION_IDS) {
        expect(html).not.toContain(`href="/docs/${id}"`);
        expect(html).not.toContain(`href="/docs/${id}/`);
      }
    }
  });
});
