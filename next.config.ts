import path from "node:path";
import type { NextConfig } from "next";
import { SITE_BASE_PATH } from "./src/lib/site";

const nextConfig: NextConfig = {
  output: "export",
  basePath: SITE_BASE_PATH,
  assetPrefix: `${SITE_BASE_PATH}/`,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: path.resolve("."),
};

export default nextConfig;
