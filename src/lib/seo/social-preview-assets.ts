import type { Metadata } from "next";
import type { BuildModeEnv } from "@/lib/build/static-export";
import { resolvePublicAssetHref } from "@/lib/navigation/site-metadata-path";
import { resolveProductionMetadataHref } from "@/lib/seo/production-metadata-base";

/**
 * Default Open Graph / Twitter social preview image (app-relative public path).
 *
 * Keep this unprefixed for Next.js Metadata fields — root `metadataBase`
 * resolves it to the production absolute URL. Use
 * {@link resolveSocialPreviewImagePublicHref} when you need a path-prefixed
 * public-asset href outside Metadata composition.
 */
export const DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH =
  "/images/og-default.png" as const;

/**
 * App-relative Open Graph `images` entry for the default social card.
 */
export function defaultSocialOpenGraphImages(): NonNullable<
  NonNullable<Metadata["openGraph"]>["images"]
> {
  return [{ url: DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH }];
}

/**
 * App-relative Twitter `images` entry for the default social card.
 */
export function defaultSocialTwitterImages(): NonNullable<
  NonNullable<Metadata["twitter"]>["images"]
> {
  return [DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH];
}

/**
 * Default Twitter card fields referencing the shared social preview image.
 */
export function defaultSocialTwitter(): {
  card: "summary_large_image";
  images: NonNullable<NonNullable<Metadata["twitter"]>["images"]>;
} {
  return {
    card: "summary_large_image",
    images: defaultSocialTwitterImages(),
  };
}

/**
 * Path-prefixed (or root-unprefixed) public-asset href for the social image.
 *
 * Project-site export → `/you-agent-factory-docs/images/og-default.png`.
 * Root / unset-base-path → `/images/og-default.png` (no forced project prefix).
 */
export function resolveSocialPreviewImagePublicHref(
  basePathOrEnv: string | BuildModeEnv = process.env,
): string {
  return resolvePublicAssetHref(
    DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH,
    basePathOrEnv,
  );
}

/**
 * Absolute production URL for the social image under the current metadataBase
 * (project-site or root origin).
 */
export function resolveSocialPreviewImageAbsoluteHref(
  env: BuildModeEnv = process.env,
): string {
  return resolveProductionMetadataHref(DEFAULT_SOCIAL_PREVIEW_IMAGE_PATH, env);
}
