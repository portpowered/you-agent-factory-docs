import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { resolveNextConfigForBuildMode } from "./src/lib/build/static-export";
import {
  bakeDocsSearchStaticBootstrapFromEnv,
  DOCS_SEARCH_BOOTSTRAP_FROM_ENV,
} from "./src/lib/search/docs-search-bootstrap-path";

const withMDX = createMDX();

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Write through to process.env so SWC/webpack NEXT_PUBLIC inlining sees the
// project-site bootstrap path, not only the next.config `env` map.
const docsSearchBootstrapFrom = bakeDocsSearchStaticBootstrapFromEnv(
  process.env,
);

const enableOpenApiSpike = process.env.ENABLE_OPENAPI_SPIKE === "1";
const openApiSpikeContentModule = path.resolve(
  projectRoot,
  "src/app/(dev)/references-openapi-spike/spike-page-content.tsx",
);
const openApiSpikeContentStubModule = path.resolve(
  projectRoot,
  "src/app/(dev)/references-openapi-spike/spike-page-content.stub.tsx",
);

/** Any W02 SSE spike enable flag keeps heavy content in the production graph. */
const enableSseSpike =
  process.env.ENABLE_SSE_OPENAPI_SPIKE === "1" ||
  process.env.ENABLE_SSE_ASYNCAPI_SPIKE === "1" ||
  process.env.ENABLE_SSE_CATALOG_SPIKE === "1" ||
  process.env.ENABLE_SSE_HYBRID_SPIKE === "1";

const sseSpikeContentAliases = [
  "sse-openapi",
  "sse-asyncapi",
  "sse-catalog",
  "sse-placement-hybrid",
].map((route) => ({
  module: path.resolve(
    projectRoot,
    `src/app/(dev)/spikes/${route}/spike-page-content.tsx`,
  ),
  stub: path.resolve(
    projectRoot,
    `src/app/(dev)/spikes/${route}/spike-page-content.stub.tsx`,
  ),
  // Match the W01 replacement pattern (extensionless import path).
  pattern: new RegExp(`[\\\\/]spikes[\\\\/]${route}[\\\\/]spike-page-content$`),
}));

const nextConfig: NextConfig = {
  ...resolveNextConfigForBuildMode(),
  // Package ships TypeScript source through its export map (no dist/); Next must transpile it.
  transpilePackages: ["@you-agent-factory/components"],
  // Keep the data-only API package outside the webpack server graph so
  // `require.resolve` / package-export reads stay Node filesystem paths during
  // static export (factories schema embeds call loadSchemaVerificationPackageModel).
  // Without this, webpack rewrites resolve results to numeric module ids and
  // prerender of /docs/factories fails with `.startsWith is not a function`.
  serverExternalPackages: ["@you-agent-factory/api"],
  env: {
    [DOCS_SEARCH_BOOTSTRAP_FROM_ENV]: docsSearchBootstrapFrom,
  },
  turbopack: {
    root: projectRoot,
  },
  /**
   * Keep the W01 OpenAPI spike and W02 SSE spikes out of production
   * static-export budgets unless their ENABLE_* flags are set. CI build uses
   * webpack (`next build --webpack`).
   */
  webpack: (config, { dev, webpack }) => {
    if (!dev && !enableOpenApiSpike) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]references-openapi-spike[\\/]spike-page-content$/,
          openApiSpikeContentStubModule,
        ),
      );
      config.resolve = config.resolve ?? {};
      config.resolve.alias = {
        ...config.resolve.alias,
        [openApiSpikeContentModule]: openApiSpikeContentStubModule,
      };
    }
    if (!dev && !enableSseSpike) {
      config.plugins = config.plugins ?? [];
      config.resolve = config.resolve ?? {};
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      for (const spike of sseSpikeContentAliases) {
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(spike.pattern, spike.stub),
        );
        config.resolve.alias[spike.module] = spike.stub;
      }
    }
    return config;
  },
};

export default withMDX(nextConfig);
