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

const nextConfig: NextConfig = {
  ...resolveNextConfigForBuildMode(),
  // Package ships TypeScript source through its export map (no dist/); Next must transpile it.
  transpilePackages: ["@you-agent-factory/components"],
  env: {
    [DOCS_SEARCH_BOOTSTRAP_FROM_ENV]: docsSearchBootstrapFrom,
  },
  turbopack: {
    root: projectRoot,
  },
  /**
   * Keep the W01 OpenAPI spike out of production static-export budgets unless
   * ENABLE_OPENAPI_SPIKE=1. CI build uses webpack (`next build --webpack`).
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
    return config;
  },
};

export default withMDX(nextConfig);
