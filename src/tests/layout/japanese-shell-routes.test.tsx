import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderArchitectureIndexPage } from "@/app/(site)/site-renderers";

describe("japanese localized shell routes", () => {
  test("render japanese architecture index with the shipped docs slice only", async () => {
    const architectureHtml = renderToStaticMarkup(
      await renderArchitectureIndexPage("ja"),
    );

    expect(architectureHtml).toContain("アーキテクチャ");
    expect(architectureHtml).toContain("Transformer アーキテクチャ");
    expect(architectureHtml).toContain(
      'href="/ja/docs/concepts/transformer-architecture"',
    );
    expect(architectureHtml).toContain("Token");
    expect(architectureHtml).toContain('href="/ja/docs/glossary/token"');
    expect(architectureHtml).not.toContain(
      "アーキテクチャ項目はまだありません",
    );
    expect(architectureHtml).not.toContain(
      'href="/ja/docs/concepts/positional-encodings"',
    );
  });
});
