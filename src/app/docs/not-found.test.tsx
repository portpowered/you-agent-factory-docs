import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import DocsNotFound from "@/app/docs/not-found";

describe("docs not-found recovery paths", () => {
  test("renders factory recovery links for install, browse, search, and blog", () => {
    const html = renderToStaticMarkup(DocsNotFound());

    expect(html).toContain("<h1");
    expect(html).toContain("Page not found");
    expect(html).toContain('aria-label="Recovery links"');
    expect(html).toContain('href="/docs/guides/getting-started"');
    expect(html).toContain(">Getting Started<");
    expect(html).toContain('href="/browse"');
    expect(html).toContain(">Browse<");
    expect(html).toContain('href="/search"');
    expect(html).toContain(">Search<");
    expect(html).toContain('href="/blog"');
    expect(html).toContain(">Blog<");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-ring");
  });

  test("keeps factory-only copy without Model Atlas or retired collection advertising", () => {
    const html = renderToStaticMarkup(DocsNotFound());

    expect(html).not.toMatch(/Model Atlas|coming soon|Browse the Atlas/i);
    expect(html).not.toMatch(
      /\/docs\/(models|modules|papers|training|systems)/i,
    );
    expect(html).not.toMatch(/\b(Models|Modules|Papers|Training|Systems)\b/);
  });
});
