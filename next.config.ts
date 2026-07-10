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
};

export default withMDX(nextConfig);
