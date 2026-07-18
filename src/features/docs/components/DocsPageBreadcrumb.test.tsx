import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildDocsBreadcrumbSegments,
  DocsPageBreadcrumb,
} from "@/features/docs/components/DocsPageBreadcrumb";
import { loadUiMessages } from "@/lib/content/ui-messages";

describe("DocsPageBreadcrumb", () => {
  test("renders clickable home and factory collection links for nested docs pages", async () => {
    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(
      <DocsPageBreadcrumb
        messages={messages}
        slug={["concepts", "harness"]}
        title="Harness"
      />,
    );

    expect(html).toContain('aria-label="breadcrumb"');
    expect(html).toContain('href="/"');
    expect(html).toContain(">Home<");
    expect(html).toContain('href="/docs/concepts"');
    expect(html).toContain(">Concepts<");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(">Harness<");
  });

  test("renders only the home link and current page for top-level docs pages", async () => {
    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(
      <DocsPageBreadcrumb
        messages={messages}
        slug={["getting-started"]}
        title="Getting Started"
      />,
    );

    expect(html).toContain('href="/"');
    expect(html).toContain(">Home<");
    expect(html).not.toContain('href="/docs/getting-started"');
    expect(html).toContain(">Getting Started<");
  });

  test("omits retired Atlas collection crumbs for non-factory section slugs", async () => {
    const messages = await loadUiMessages();
    const segments = buildDocsBreadcrumbSegments(
      ["modules", "relu"],
      "ReLU",
      messages,
    );
    const html = renderToStaticMarkup(
      <DocsPageBreadcrumb
        messages={messages}
        slug={["modules", "relu"]}
        title="ReLU"
      />,
    );

    expect(segments.map((segment) => segment.label)).toEqual(["Home", "ReLU"]);
    expect(html).not.toContain('href="/docs/modules"');
    expect(html).not.toContain(">Modules<");
    expect(html).not.toContain(">Models<");
    expect(html).not.toContain(">Papers<");
    expect(html).not.toContain(">Training<");
    expect(html).not.toContain(">Systems<");
  });

  test("inserts intermediate ancestry crumbs between collection and leaf", async () => {
    const messages = await loadUiMessages();
    const segments = buildDocsBreadcrumbSegments(
      ["documentation", "configuration", "sessions"],
      "Sessions",
      messages,
    );

    expect(segments.map((segment) => segment.label)).toEqual([
      "Home",
      "Program documentation",
      "Configuration",
      "Sessions",
    ]);
    expect(segments[1]?.href).toBe("/docs/documentation");
    expect(segments[2]?.href).toBe("/docs/documentation/configuration");
  });
});
