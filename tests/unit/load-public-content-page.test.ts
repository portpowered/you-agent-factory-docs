import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { loadPublicContentPage } from "../../src/lib/content";

const STARTER_CONTENT_ROOT = join(import.meta.dir, "../../src/content");

describe("loadPublicContentPage", () => {
  test.each([
    {
      kind: "blog",
      slug: "introducing-factory",
      title: "Introducing You Agent Factory",
      routePath: "/blog/introducing-factory",
      bodyText: "Starter blog content for the shared canonical model.",
      section: "updates",
    },
    {
      kind: "glossary",
      slug: "agent",
      title: "Agent",
      routePath: "/glossary/agent",
      bodyText: "Starter glossary entry for canonical content validation.",
      section: "terms",
    },
    {
      kind: "comparison",
      slug: "vs-n8n",
      title: "You Agent Factory vs n8n",
      routePath: "/comparisons/vs-n8n",
      bodyText: "Starter comparison content for the canonical model.",
      section: "comparisons",
    },
    {
      kind: "reference",
      slug: "loop-engineering",
      title: "Loop engineering",
      routePath: "/references/loop-engineering",
      bodyText: "Starter reference content for canonical record generation.",
      section: "references",
    },
  ])(
    "loads the published $kind starter page from canonical content records",
    ({ bodyText, kind, routePath, section, slug, title }) => {
      const page = loadPublicContentPage(kind, slug, STARTER_CONTENT_ROOT);

      expect(page.record.id).toBe(`${kind}/${slug}`);
      expect(page.record.routePath).toBe(routePath);
      expect(page.record.section).toBe(section);
      expect(page.title).toBe(title);
      expect(page.body).toContain(bodyText);
      expect(page.resolution).toEqual({
        canonicalPageId: `${kind}/${slug}`,
        canonicalLocale: "en",
        requestedLocale: "en",
        resolvedLocale: "en",
        fellBackToCanonicalLocale: false,
      });
    },
  );
});
