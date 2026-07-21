/**
 * Public URL paths for homepage assets staged under `public/home/*`.
 *
 * Feature lanes load these as `/home/...` without inventing CMS/asset schemas.
 * Filenames match the planner image sources when present (see homepage-2 README).
 */

export const LANDING_HOME_ASSET_ROOT = "/home" as const;

export const LANDING_HOME_PUBLIC_DIR = "public/home" as const;

/**
 * Staged homepage asset filenames (basename under `public/home/`).
 * Keep in sync with whatever `scripts/stage-homepage-assets.ts` writes.
 */
export const landingHomeAssetFiles = {
  womanHead: "woman-head.png",
  midEndWhale: "mid-end-whale.png",
  monkey: "monkey.png",
  factoryGraphUi: "factory-graph-ui.png",
  seadragonCrop: "seadragon-crop.png",
  ctaFog: "cta-fog.png",
  downTransition: "down-transition.png",
  octopus: "octopus.png",
  youYouYouBackground: "you-you-you-background.png",
  youSample: "you-sample.jpg",
} as const;

export type LandingHomeAssetKey = keyof typeof landingHomeAssetFiles;

export const landingHomeAssets = {
  womanHead: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.womanHead}`,
  midEndWhale: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.midEndWhale}`,
  monkey: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.monkey}`,
  factoryGraphUi: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.factoryGraphUi}`,
  seadragonCrop: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.seadragonCrop}`,
  ctaFog: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.ctaFog}`,
  downTransition: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.downTransition}`,
  octopus: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.octopus}`,
  youYouYouBackground: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.youYouYouBackground}`,
  youSample: `${LANDING_HOME_ASSET_ROOT}/${landingHomeAssetFiles.youSample}`,
} as const;

/** Build a `/home/<filename>` public path for harness and feature consumers. */
export function landingHomeAssetPath(filename: string): string {
  const trimmed = filename.replace(/^\/+/, "");
  return `${LANDING_HOME_ASSET_ROOT}/${trimmed}`;
}
