/**
 * W15 story 004: nested family breadcrumbs use topology nav labels, link to
 * family indexes, and preserve deeper ancestry between family and leaf.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildDocsBreadcrumbSegments,
  DocsPageBreadcrumb,
} from "@/features/docs/components/DocsPageBreadcrumb";
import {
  RETIRED_ATLAS_NAV_COLLECTION_IDS,
  RETIRED_ATLAS_NAV_FOLDER_LABELS,
} from "@/lib/content/factory-breadcrumb-sidebar";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { DIRECT_DOCS_ROUTE_FAMILY_IDS } from "@/lib/docs/collection-definition-contract";
import { supportedLocales } from "@/lib/i18n/locale-routing";

const REPRESENTATIVE_FAMILY_PAGES = [
  {
    familyId: "references" as const,
    slug: ["references", "api"] as const,
    title: "API",
  },
  {
    familyId: "factories" as const,
    slug: ["factories", "configuration"] as const,
    title: "Configuration",
  },
  {
    familyId: "workers" as const,
    slug: ["workers", "agent"] as const,
    title: "Agent worker",
  },
  {
    familyId: "workstations" as const,
    slug: ["workstations", "inference-run"] as const,
    title: "Inference-run workstation",
  },
] as const;

describe("W15 family breadcrumbs", () => {
  test("nested pages under each family render Home → family index → page title", async () => {
    const messages = await loadUiMessages();

    expect(REPRESENTATIVE_FAMILY_PAGES.map((page) => page.familyId)).toEqual([
      ...DIRECT_DOCS_ROUTE_FAMILY_IDS,
    ]);

    for (const page of REPRESENTATIVE_FAMILY_PAGES) {
      const familyLabel = messages.nav[page.familyId];
      const segments = buildDocsBreadcrumbSegments(
        [...page.slug],
        page.title,
        messages,
      );
      const html = renderToStaticMarkup(
        <DocsPageBreadcrumb
          messages={messages}
          slug={[...page.slug]}
          title={page.title}
        />,
      );

      expect(segments.map((segment) => segment.label)).toEqual([
        "Home",
        familyLabel,
        page.title,
      ]);
      expect(segments[1]?.href).toBe(`/docs/${page.familyId}`);
      expect(html).toContain('href="/"');
      expect(html).toContain(`href="/docs/${page.familyId}"`);
      expect(html).toContain(`>${familyLabel}<`);
      expect(html).toContain(`>${page.title}<`);
      expect(html).toContain('aria-current="page"');

      for (const retired of RETIRED_ATLAS_NAV_FOLDER_LABELS) {
        expect(html).not.toContain(`>${retired}<`);
      }
      for (const id of RETIRED_ATLAS_NAV_COLLECTION_IDS) {
        expect(html).not.toContain(`href="/docs/${id}"`);
      }
    }
  });

  test("family crumb labels use localized topology nav keys, not English constants", async () => {
    for (const locale of supportedLocales) {
      const messages = await loadUiMessages(locale);

      for (const page of REPRESENTATIVE_FAMILY_PAGES) {
        const familyLabel = messages.nav[page.familyId];
        expect(familyLabel.trim().length).toBeGreaterThan(0);
        expect(familyLabel).not.toBe(page.familyId);

        const segments = buildDocsBreadcrumbSegments(
          [...page.slug],
          page.title,
          messages,
          locale,
        );

        expect(segments[1]?.label).toBe(familyLabel);
      }
    }
  });

  test("deeper nested ancestry appears between the family crumb and current page", async () => {
    const messages = await loadUiMessages();
    const slug = ["references", "api", "operations"] as const;
    const title = "List operations";

    const segments = buildDocsBreadcrumbSegments([...slug], title, messages);
    const html = renderToStaticMarkup(
      <DocsPageBreadcrumb messages={messages} slug={[...slug]} title={title} />,
    );

    expect(segments.map((segment) => segment.label)).toEqual([
      "Home",
      messages.nav.references,
      "Api",
      title,
    ]);
    expect(segments[1]?.href).toBe("/docs/references");
    expect(segments[2]?.href).toBe("/docs/references/api");
    expect(html).toContain('href="/docs/references"');
    expect(html).toContain('href="/docs/references/api"');
    expect(html).toContain(`>${messages.nav.references}<`);
    expect(html).toContain(">Api<");
    expect(html).toContain(`>${title}<`);
    expect(html).not.toContain("/docs/references/api/operations");
  });
});
