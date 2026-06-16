import { SITE_BASE_PATH } from "@/lib/site";
import nextConfig from "../../../next.config";

export type StaticExportConfig = {
  output: string | undefined;
  basePath: string | undefined;
  assetPrefix: string | undefined;
  trailingSlash: boolean | undefined;
  imagesUnoptimized: boolean | undefined;
};

export type StaticExportIssue = {
  field: string;
  message: string;
};

export type StaticExportValidationResult = {
  valid: boolean;
  issues: StaticExportIssue[];
};

/** Reads the current Next.js static export configuration. */
export function getStaticExportConfig(): StaticExportConfig {
  return {
    output: nextConfig.output,
    basePath: nextConfig.basePath,
    assetPrefix: nextConfig.assetPrefix,
    trailingSlash: nextConfig.trailingSlash,
    imagesUnoptimized: nextConfig.images?.unoptimized,
  };
}

/** Validates the GitHub Pages-safe static export baseline. */
export function validateStaticExportConfig(
  config: StaticExportConfig = getStaticExportConfig(),
): StaticExportValidationResult {
  const issues: StaticExportIssue[] = [];

  if (config.output !== "export") {
    issues.push({
      field: "output",
      message: 'Next.js output must be "export" for static GitHub Pages export',
    });
  }

  if (config.basePath !== SITE_BASE_PATH) {
    issues.push({
      field: "basePath",
      message: `basePath must be ${SITE_BASE_PATH}`,
    });
  }

  const expectedAssetPrefix = `${SITE_BASE_PATH}/`;
  if (config.assetPrefix !== expectedAssetPrefix) {
    issues.push({
      field: "assetPrefix",
      message: `assetPrefix must be ${expectedAssetPrefix}`,
    });
  }

  if (config.trailingSlash !== true) {
    issues.push({
      field: "trailingSlash",
      message: "trailingSlash must be enabled for GitHub Pages-safe routes",
    });
  }

  if (config.imagesUnoptimized !== true) {
    issues.push({
      field: "images.unoptimized",
      message: "images.unoptimized must be true for static export",
    });
  }

  return { valid: issues.length === 0, issues };
}

/** Throws when the static export configuration regresses. */
export function assertValidStaticExportConfig(
  config: StaticExportConfig = getStaticExportConfig(),
): void {
  const result = validateStaticExportConfig(config);
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join("\n");

  throw new Error(`Static export validation failed:\n${details}`);
}
