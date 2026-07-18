import { describe, expect, test } from "bun:test";
import {
  workersPageHref,
  workstationsPageHref,
} from "@/lib/content/content-hrefs";
import {
  docsSectionFromSlug,
  PUBLISHED_DOCS_SECTIONS,
  type PublishedDocsEntry,
  publishedDocsHrefFromEntry,
  publishedDocsRelativeSlug,
} from "@/lib/content/published-docs-registry-contract";

function workersPublishedEntry(
  overrides: Partial<PublishedDocsEntry> &
    Pick<PublishedDocsEntry, "docsSlug" | "slug" | "url">,
): PublishedDocsEntry {
  return {
    registryId: "documentation.workers-agent",
    pageKind: "documentation",
    section: "workers",
    ...overrides,
  };
}

describe("published docs registry contract — workers section", () => {
  test("accepts workers as a first-class published docs section", () => {
    expect(PUBLISHED_DOCS_SECTIONS).toContain("workers");
    expect(docsSectionFromSlug("workers/agent")).toBe("workers");
    expect(docsSectionFromSlug("workers/agent/variant")).toBe("workers");
  });

  test("rejects unsupported sections the same way as before", () => {
    expect(() => docsSectionFromSlug("modules/attention")).toThrow(
      /Unsupported published docs section "modules"/,
    );
    expect(() => docsSectionFromSlug("factories/configuration")).toThrow(
      /Unsupported published docs section "factories"/,
    );
  });

  test("canonical workers hrefs resolve under /docs/workers, including nested slugs", () => {
    expect(workersPageHref("agent")).toBe("/docs/workers/agent");
    expect(workersPageHref("agent/variant")).toBe(
      "/docs/workers/agent/variant",
    );

    const flat = workersPublishedEntry({
      docsSlug: "workers/agent",
      slug: "agent",
      url: "/docs/workers/agent",
    });
    expect(publishedDocsRelativeSlug(flat)).toBe("agent");
    expect(publishedDocsHrefFromEntry(flat)).toBe("/docs/workers/agent");

    const nested = workersPublishedEntry({
      registryId: "documentation.workers-agent-variant",
      docsSlug: "workers/agent/variant",
      slug: "variant",
      url: "/docs/workers/agent/variant",
    });
    expect(publishedDocsRelativeSlug(nested)).toBe("agent/variant");
    expect(publishedDocsHrefFromEntry(nested)).toBe(
      "/docs/workers/agent/variant",
    );
  });

  test("preserves existing CLI section href behavior", () => {
    const documentation: PublishedDocsEntry = {
      registryId: "documentation.workers",
      slug: "workers",
      docsSlug: "documentation/workers",
      url: "/docs/documentation/workers",
      pageKind: "documentation",
      section: "documentation",
    };
    expect(publishedDocsHrefFromEntry(documentation)).toBe(
      "/docs/documentation/workers",
    );
  });
});

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
