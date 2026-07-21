#!/usr/bin/env bun
/**
 * Stage homepage visual assets into `public/home/*`.
 *
 * Looks for planner / sibling image sources (docs/temp/images, ../images).
 * When sources exist, copies/optimizes web-ready files into public/home.
 * When sources are absent, ensures public/home/ exists and exits 0.
 *
 * Usage: bun ./scripts/stage-homepage-assets.ts
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import sharp from "sharp";
import {
  LANDING_HOME_PUBLIC_DIR,
  landingHomeAssetFiles,
} from "../src/features/landing-page/landing-page.assets";

const MAX_EDGE_PX = 2048;

/** Source basenames we stage when present (skip huge design-only PNG duplicate). */
const SOURCE_BASENAMES = new Set<string>([
  ...Object.values(landingHomeAssetFiles),
  "you-sample.png", // ignored below; prefer jpg
]);

function candidateSourceDirs(cwd: string): string[] {
  const dirs: string[] = [join(cwd, "docs/temp/images")];
  let current = cwd;
  for (let i = 0; i < 6; i += 1) {
    dirs.push(join(current, "images"));
    dirs.push(resolve(current, "../images"));
    const parent = resolve(current, "..");
    if (parent === current) break;
    current = parent;
  }
  return [...new Set(dirs)];
}

function findSourceDir(cwd: string): string | null {
  for (const dir of candidateSourceDirs(cwd)) {
    if (!existsSync(dir)) continue;
    const entries = readdirSync(dir);
    if (
      entries.some(
        (name) =>
          SOURCE_BASENAMES.has(name) || /\.(png|jpe?g|webp)$/i.test(name),
      )
    ) {
      return dir;
    }
  }
  return null;
}

async function optimizeToPng(sourcePath: string, destPath: string) {
  await sharp(sourcePath)
    .rotate()
    .resize({
      width: MAX_EDGE_PX,
      height: MAX_EDGE_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, palette: false })
    .toFile(destPath);
}

async function optimizeToJpeg(sourcePath: string, destPath: string) {
  await sharp(sourcePath)
    .rotate()
    .resize({
      width: MAX_EDGE_PX,
      height: MAX_EDGE_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(destPath);
}

async function stageFile(sourcePath: string, destPath: string) {
  const lower = sourcePath.toLowerCase();
  try {
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      await optimizeToJpeg(sourcePath, destPath);
      return;
    }
    if (lower.endsWith(".png") || lower.endsWith(".webp")) {
      await optimizeToPng(sourcePath, destPath);
      return;
    }
    copyFileSync(sourcePath, destPath);
  } catch {
    // Faithful copy is acceptable when optimization fails.
    copyFileSync(sourcePath, destPath);
  }
}

async function main() {
  const cwd = process.cwd();
  const destDir = join(cwd, LANDING_HOME_PUBLIC_DIR);
  mkdirSync(destDir, { recursive: true });

  const sourceDir = findSourceDir(cwd);
  if (!sourceDir) {
    console.log(
      `[stage-homepage-assets] No sources found under docs/temp/images or sibling images/. Left ${LANDING_HOME_PUBLIC_DIR}/ in place.`,
    );
    return;
  }

  console.log(`[stage-homepage-assets] Sources: ${sourceDir}`);
  console.log(`[stage-homepage-assets] Dest:    ${destDir}`);

  const staged: string[] = [];
  for (const filename of Object.values(landingHomeAssetFiles)) {
    const sourcePath = join(sourceDir, filename);
    if (!existsSync(sourcePath)) {
      console.log(`[stage-homepage-assets] skip missing ${filename}`);
      continue;
    }
    const destPath = join(destDir, basename(filename));
    await stageFile(sourcePath, destPath);
    staged.push(filename);
    console.log(`[stage-homepage-assets] staged ${filename}`);
  }

  console.log(
    `[stage-homepage-assets] Done. Staged ${staged.length} file(s) into ${LANDING_HOME_PUBLIC_DIR}/.`,
  );
}

await main();
