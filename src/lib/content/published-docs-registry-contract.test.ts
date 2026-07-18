import { describe, expect, test } from "bun:test";
import { workstationsPageHref } from "@/lib/content/content-hrefs";
import {
  docsSectionFromSlug,
  PUBLISHED_DOCS_SECTIONS,
  type PublishedDocsEntry,
  publishedDocsHrefFromEntry,
  publishedDocsRelativeSlug,
} from "@/lib/content/published-docs-registry-contract";

function workstationsPublishedEntry(
  overrides: Partial<PublishedDocsEntry> &
    Pick<PublishedDocsEntry, "docsSlug" | "slug" | "url">,
): PublishedDocsEntry {
  return {
    registryId: "documentation.workstations-agent-run",
    pageKind: "documentation",
    section: "workstations",
    ...overrides,
  };
}

describe("published docs registry contract — workstations section", () => {
  test("accepts workstations as a first-class published docs section", () => {
    expect(PUBLISHED_DOCS_SECTIONS).toContain("workstations");
    expect(docsSectionFromSlug("workstations/agent-run")).toBe("workstations");
    expect(docsSectionFromSlug("workstations/agent-run/variant")).toBe(
      "workstations",
    );
  });

  test("rejects unsupported sections the same way as before", () => {
    expect(() => docsSectionFromSlug("modules/attention")).toThrow(
      /Unsupported published docs section "modules"/,
    );
    expect(() => docsSectionFromSlug("factories/configuration")).toThrow(
      /Unsupported published docs section "factories"/,
    );
  });

  test("canonical workstations hrefs resolve under /docs/workstations, including nested slugs", () => {
    expect(workstationsPageHref("agent-run")).toBe(
      "/docs/workstations/agent-run",
    );
    expect(workstationsPageHref("agent-run/variant")).toBe(
      "/docs/workstations/agent-run/variant",
    );

    const flat = workstationsPublishedEntry({
      docsSlug: "workstations/agent-run",
      slug: "agent-run",
      url: "/docs/workstations/agent-run",
    });
    expect(publishedDocsRelativeSlug(flat)).toBe("agent-run");
    expect(publishedDocsHrefFromEntry(flat)).toBe(
      "/docs/workstations/agent-run",
    );

    const nested = workstationsPublishedEntry({
      registryId: "documentation.workstations-agent-run-variant",
      docsSlug: "workstations/agent-run/variant",
      slug: "variant",
      url: "/docs/workstations/agent-run/variant",
    });
    expect(publishedDocsRelativeSlug(nested)).toBe("agent-run/variant");
    expect(publishedDocsHrefFromEntry(nested)).toBe(
      "/docs/workstations/agent-run/variant",
    );
  });

  test("preserves existing CLI section href behavior", () => {
    const documentation: PublishedDocsEntry = {
      registryId: "documentation.workstations",
      slug: "workstations",
      docsSlug: "documentation/workstations",
      url: "/docs/documentation/workstations",
      pageKind: "documentation",
      section: "documentation",
    };
    expect(publishedDocsHrefFromEntry(documentation)).toBe(
      "/docs/documentation/workstations",
    );
  });
});
