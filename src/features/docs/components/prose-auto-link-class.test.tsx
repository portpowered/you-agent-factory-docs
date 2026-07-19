import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProseAutoLinkText } from "@/features/docs/components/ProseAutoLinkText";
import { proseAutoLinkClassName } from "@/features/docs/components/prose-auto-link-class";

describe("proseAutoLinkClassName", () => {
  test("uses secondary blue for link and underline accent, not primary yellow", () => {
    expect(proseAutoLinkClassName).toContain("text-secondary");
    expect(proseAutoLinkClassName).toContain("decoration-secondary");
    expect(proseAutoLinkClassName).toContain("hover:underline");
    expect(proseAutoLinkClassName).toContain("focus-visible:ring-2");
    expect(proseAutoLinkClassName).not.toContain("text-primary");
    expect(proseAutoLinkClassName).not.toContain("decoration-primary");
  });

  test("rendered prose auto-links apply the secondary accent classes", () => {
    const html = renderToStaticMarkup(
      <ProseAutoLinkText text="See Model Context Protocol for host loops." />,
    );

    expect(html).toContain('href="/docs/concepts/mcp"');
    expect(html).toContain('data-prose-auto-link="true"');
    expect(html).toContain("text-secondary");
    expect(html).toContain("decoration-secondary");
    expect(html).not.toMatch(/\btext-primary\b/);
  });
});
