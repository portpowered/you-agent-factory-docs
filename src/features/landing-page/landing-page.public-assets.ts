import type { BuildModeEnv } from "@/lib/build/static-export";
import { resolvePublicAssetHref } from "@/lib/navigation/site-metadata-path";
import {
  type LandingHomeAssetKey,
  landingHomeAssets,
} from "./landing-page.assets";

export type ResolvedLandingHomeAssets = Record<LandingHomeAssetKey, string>;

/** Resolve every homepage public asset for a root or project-site deployment. */
export function resolveLandingHomeAssets(
  basePathOrEnv: string | BuildModeEnv = process.env,
): ResolvedLandingHomeAssets {
  return Object.fromEntries(
    Object.entries(landingHomeAssets).map(([key, assetPath]) => [
      key,
      resolvePublicAssetHref(assetPath, basePathOrEnv),
    ]),
  ) as ResolvedLandingHomeAssets;
}
