import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "./SiteFooter";
import type { FooterColumn, FooterMeta } from "./site-footer.types";

const fixtureColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Guides", href: "/docs/guides" },
      { label: "Concepts", href: "/docs/concepts" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "About", href: "/about" }],
  },
];

const fixtureMeta: FooterMeta = {
  copyright: "© 2026 you-agent-factory",
  links: [{ label: "Privacy", href: "/privacy" }],
};

describe("SiteFooter", () => {
  test("renders fixture column titles, link labels, and navigable hrefs", () => {
    const html = renderToStaticMarkup(
      <SiteFooter columns={fixtureColumns} meta={fixtureMeta} />,
    );

    expect(html).toContain("Product");
    expect(html).toContain("Company");
    expect(html).toContain("Guides");
    expect(html).toContain("Concepts");
    expect(html).toContain("About");
    expect(html).toContain('href="/docs/guides"');
    expect(html).toContain('href="/docs/concepts"');
    expect(html).toContain('href="/about"');
  });

  test("renders meta row content below column groups", () => {
    const html = renderToStaticMarkup(
      <SiteFooter columns={fixtureColumns} meta={fixtureMeta} />,
    );

    const columnsIndex = html.indexOf('data-testid="site-footer-columns"');
    const metaIndex = html.indexOf('data-testid="site-footer-meta"');
    expect(columnsIndex).toBeGreaterThan(-1);
    expect(metaIndex).toBeGreaterThan(columnsIndex);
    expect(html).toContain("© 2026 you-agent-factory");
    expect(html).toContain("Privacy");
    expect(html).toContain('href="/privacy"');
  });

  test("empty columns still render stable footer chrome and meta without throwing", () => {
    const html = renderToStaticMarkup(
      <SiteFooter columns={[]} meta={{ copyright: "© empty columns" }} />,
    );

    expect(html).toContain('data-testid="site-footer"');
    expect(html).toContain('data-testid="site-footer-meta"');
    expect(html).toContain("© empty columns");
    expect(html).not.toContain('data-testid="site-footer-columns"');
    expect(html).not.toContain('data-testid="site-footer-art"');
  });

  test("omitting art does not reserve an empty art surface", () => {
    const html = renderToStaticMarkup(
      <SiteFooter columns={fixtureColumns} meta={fixtureMeta} />,
    );

    expect(html).not.toContain('data-testid="site-footer-art"');
  });

  test("renders provided art node inside the footer art slot", () => {
    const html = renderToStaticMarkup(
      <SiteFooter
        columns={fixtureColumns}
        meta={fixtureMeta}
        art={
          <div
            data-testid="fixture-art-placeholder"
            style={{ background: "crimson" }}
          >
            Footer art placeholder
          </div>
        }
      />,
    );

    expect(html).toContain('data-testid="site-footer-art"');
    expect(html).toContain('data-testid="fixture-art-placeholder"');
    expect(html).toContain("Footer art placeholder");
    expect(html).toContain("crimson");
    expect(html).toContain('data-testid="site-footer-columns"');
    expect(html).toContain('data-testid="site-footer-meta"');
  });

  test("uses footer landmark and labeled nav; columns stack on narrow viewports", () => {
    const html = renderToStaticMarkup(
      <SiteFooter columns={fixtureColumns} meta={fixtureMeta} />,
    );

    expect(html).toContain("<footer");
    expect(html).toContain('aria-label="Site footer"');
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("lg:grid-cols-4");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain('href="/docs/guides"');
  });
});
