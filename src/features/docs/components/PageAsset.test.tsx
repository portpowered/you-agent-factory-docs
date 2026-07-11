import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { PageAsset } from "@/features/docs/components/PageAsset";
import { PageAssetsProvider } from "@/features/docs/components/page-assets-context";
import { PageMessagesProvider } from "@/features/docs/components/page-messages-context";
import { parsePageAssetConfig } from "@/lib/content/assets";
import type { PageAssetConfig, PageMessages } from "@/lib/content/schemas";

const assets = JSON.parse(
  readFileSync(
    join(import.meta.dir, "../../../lib/content/__fixtures__/page-assets.json"),
    "utf8",
  ),
) as PageAssetConfig;
const messages = JSON.parse(
  readFileSync(
    join(
      import.meta.dir,
      "../../../lib/content/__fixtures__/page-messages.json",
    ),
    "utf8",
  ),
) as PageMessages;

function renderPageAsset(
  assetId: string,
  isDev: boolean,
  assetConfig: PageAssetConfig = assets,
  pageMessages: PageMessages = messages,
) {
  return renderToStaticMarkup(
    <PageMessagesProvider messages={pageMessages} isDev={isDev}>
      <PageAssetsProvider assets={assetConfig} isDev={isDev}>
        <PageAsset assetId={assetId} />
      </PageAssetsProvider>
    </PageMessagesProvider>,
  );
}

describe("PageAsset", () => {
  test("renders a visible image asset with alt text and caption", () => {
    const html = renderPageAsset("hero", false);
    expect(html).toContain('data-page-asset="hero"');
    expect(html).toContain('data-asset-type="image"');
    expect(html).toContain('src="./assets/gqa-hero.png"');
    expect(html).toContain(
      "Diagram comparing multi-head attention and grouped-query attention head grouping.",
    );
    expect(html).toContain(
      "Query heads share fewer key-value heads in grouped-query attention.",
    );
  });

  test("renders a stub graph asset with graph id, renderer, and caption", () => {
    const html = renderPageAsset("computeFlow", false);
    expect(html).toContain('data-page-asset="computeFlow"');
    expect(html).toContain('data-asset-type="graph"');
    expect(html).toContain(
      'data-graph-id="graph.grouped-query-attention-compute-flow"',
    );
    expect(html).toContain('data-web-renderer="react-flow"');
    expect(html).toContain(
      "GQA compute flow from queries through shared KV heads.",
    );
  });

  test("renders a table asset stub with table id and caption", () => {
    const html = renderPageAsset("comparisonTable", false);
    expect(html).toContain('data-page-asset="comparisonTable"');
    expect(html).toContain('data-asset-type="table"');
    expect(html).toContain(">table.grouped-query-attention-comparison<");
    expect(html).toContain("How GQA compares with nearby attention variants.");
  });

  test("renders chart and code-schema structured asset placeholders", () => {
    const chartHtml = renderPageAsset("trainingChart", false);
    expect(chartHtml).toContain('data-page-asset="trainingChart"');
    expect(chartHtml).toContain('data-asset-type="chart"');
    expect(chartHtml).toContain(
      'data-asset-reference-id="chart.gqa-training-cost"',
    );
    expect(chartHtml).toContain(
      "Training cost trend for grouped-query attention.",
    );

    const schemaHtml = renderPageAsset("codeSchema", false);
    expect(schemaHtml).toContain('data-page-asset="codeSchema"');
    expect(schemaHtml).toContain('data-asset-type="code-schema"');
    expect(schemaHtml).toContain(
      'data-asset-reference-id="schema.gqa-forward-pass"',
    );
  });

  test("renders an attention-variant-graph stub with comparison markers", () => {
    const variantAssets = parsePageAssetConfig({
      variantCompare: {
        type: "attention-variant-graph",
        defaultVariantId: "variant.gqa",
        variants: [
          {
            variantId: "variant.gqa",
            graphId: "graph.gqa",
            labelKey: "assets.computeFlow.alt",
          },
          {
            variantId: "variant.mha",
            graphId: "graph.mha",
            labelKey: "assets.computeFlow.caption",
          },
        ],
        webRenderer: "react-flow",
        printRenderer: "mermaid",
        altKey: "assets.computeFlow.alt",
        captionKey: "assets.computeFlow.caption",
      },
    });
    const html = renderPageAsset(
      "variantCompare",
      false,
      variantAssets,
      messages,
    );
    expect(html).toContain('data-page-asset="variantCompare"');
    expect(html).toContain('data-asset-type="attention-variant-graph"');
    expect(html).toContain('data-attention-variant-comparison="true"');
    expect(html).toContain('data-attention-variant-default="variant.gqa"');
  });

  test("shows a developer-visible error for a missing asset ID", () => {
    const html = renderPageAsset("missingAsset", true);
    expect(html).toContain('data-missing-asset-id="missingAsset"');
    expect(html).toContain("Missing asset ID: missingAsset");
  });

  test("renders nothing outside development for a missing asset ID", () => {
    const html = renderPageAsset("missingAsset", false);
    expect(html).toBe("");
  });
});
