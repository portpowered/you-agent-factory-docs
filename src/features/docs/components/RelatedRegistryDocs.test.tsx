import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { PageMessagesProvider } from "@/features/docs/components/page-messages-context";
import {
  DEFAULT_RELATED_REGISTRY_DOCS_ALL_UNAVAILABLE_FALLBACK,
  DEFAULT_RELATED_REGISTRY_DOCS_EMPTY_FALLBACK,
  DEFAULT_RELATED_REGISTRY_DOCS_PARTIAL_UNAVAILABLE_STATUS,
  RelatedRegistryDocs,
} from "@/features/docs/components/RelatedRegistryDocs";
import {
  RELATED_REGISTRY_DOCS_MISSING_ID,
  relatedRegistryDocsBottlenecks,
  relatedRegistryDocsDraftConcept,
  relatedRegistryDocsHarness,
  relatedRegistryDocsResolveOptions,
} from "@/lib/content/related-registry-docs.test-fixtures";

const TEST_PAGE_MESSAGES = {
  title: "Test page",
  description: "Test description",
};

afterEach(() => {
  cleanup();
});

describe("RelatedRegistryDocs", () => {
  test("renders compact published links with docs chrome styling", () => {
    const html = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={[
          relatedRegistryDocsHarness.id,
          relatedRegistryDocsBottlenecks.id,
        ]}
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );

    expect(html).toContain('data-testid="related-registry-docs"');
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).toContain('href="/docs/concepts/bottlenecks"');
    expect(html).toContain("Harness");
    expect(html).toContain("Bottlenecks");
    expect(html).toContain("no-underline");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).not.toContain(relatedRegistryDocsHarness.id);
  });

  test("renders configured empty fallback when input is empty", () => {
    const html = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={[]}
        emptyFallback="No related docs configured."
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );

    expect(html).toContain('data-testid="related-registry-docs-empty"');
    expect(html).toContain("No related docs configured.");
    expect(html).not.toContain("<a");
  });

  test("renders all-unavailable fallback without broken anchors", () => {
    const html = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={[
          RELATED_REGISTRY_DOCS_MISSING_ID,
          relatedRegistryDocsDraftConcept.id,
        ]}
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );

    expect(html).toContain('data-testid="related-registry-docs-unavailable"');
    expect(html).toContain(
      DEFAULT_RELATED_REGISTRY_DOCS_ALL_UNAVAILABLE_FALLBACK,
    );
    expect(html).not.toContain("<a");
    expect(html).not.toContain(RELATED_REGISTRY_DOCS_MISSING_ID);
  });

  test("renders valid links and partial-unavailable status for mixed input", () => {
    const html = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={[
          RELATED_REGISTRY_DOCS_MISSING_ID,
          relatedRegistryDocsBottlenecks.id,
          relatedRegistryDocsDraftConcept.id,
        ]}
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );

    expect(html).toContain('href="/docs/concepts/bottlenecks"');
    expect(html).toContain("Bottlenecks");
    expect(html).toContain(
      'data-testid="related-registry-docs-partial-unavailable"',
    );
    expect(html).toContain(
      DEFAULT_RELATED_REGISTRY_DOCS_PARTIAL_UNAVAILABLE_STATUS,
    );
    expect(html).not.toContain(RELATED_REGISTRY_DOCS_MISSING_ID);
    expect(html).not.toContain("Draft related");
  });

  test("localizes shipped docs links from page context", () => {
    const html = renderToStaticMarkup(
      <PageMessagesProvider
        messages={TEST_PAGE_MESSAGES}
        locale="vi"
        isDev={false}
      >
        <RelatedRegistryDocs
          registryIds={[relatedRegistryDocsBottlenecks.id]}
          resolveOptions={relatedRegistryDocsResolveOptions}
        />
      </PageMessagesProvider>,
    );

    expect(html).toContain('href="/vi/docs/concepts/bottlenecks"');
  });

  test("exposes accessible list semantics for available links", () => {
    render(
      <RelatedRegistryDocs
        registryIds={[
          relatedRegistryDocsHarness.id,
          relatedRegistryDocsBottlenecks.id,
        ]}
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );

    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Harness" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bottlenecks" })).toBeTruthy();
  });

  test("uses default empty fallback copy when none is configured", () => {
    const html = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={[]}
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );

    expect(html).toContain(DEFAULT_RELATED_REGISTRY_DOCS_EMPTY_FALLBACK);
  });
});
