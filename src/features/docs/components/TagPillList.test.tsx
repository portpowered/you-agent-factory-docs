import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { TagPillList } from "@/features/docs/components/TagPillList";

describe("TagPillList", () => {
  test("renders keyboard-focusable pills from explicit factory tags", () => {
    const html = renderToStaticMarkup(
      <TagPillList tags={["foundations", "taxonomy"]} />,
    );

    expect(html).toContain('data-testid="tag-pill-list"');
    expect(html).toContain("list-none");
    expect(html).toContain("p-0");
    expect(html).toContain('href="/tags/foundations"');
    expect(html).toContain('href="/tags/taxonomy"');
    expect(html).toContain("Foundations");
    expect(html).toContain("Taxonomy");
    expect(html).toContain("no-underline");
    const withoutNoUnderline = html.replaceAll("no-underline", "");
    expect(withoutNoUnderline).not.toMatch(/\bunderline\b/);
    expect(html).toContain("focus-visible:ring-2");
  });

  test("renders pills from an explicit tags prop", () => {
    const html = renderToStaticMarkup(<TagPillList tags={["local-models"]} />);

    expect(html).toContain('href="/tags/local-models"');
    expect(html).toContain("Local Models");
  });

  test("renders nothing when there are no tags", () => {
    const html = renderToStaticMarkup(<TagPillList tags={[]} />);
    expect(html).toBe("");
  });

  test("renders nothing for a published concept with empty tags", () => {
    const html = renderToStaticMarkup(
      <TagPillList registryId="concept.bottlenecks" />,
    );

    expect(html).toBe("");
  });

  test("renders nothing for an unknown registry id", () => {
    const html = renderToStaticMarkup(
      <TagPillList registryId="concept.unknown-concept" />,
    );
    expect(html).toBe("");
  });
});
