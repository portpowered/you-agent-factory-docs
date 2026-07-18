/**
 * Build/server-only browser bundling for W03 acquisition exclusion proofs.
 *
 * Uses Bun's browser-targeted bundler so tests can observe whether Node
 * filesystem / package-resolution modules fail closed (or leak markers) when
 * pulled into a client-shaped chunk. Do not import from client UI code.
 */

import { resolve } from "node:path";
import type { ApiPackageAcquisitionBrowserBundleAttempt } from "./api-package-acquisition-browser-exclusion";

export type BundleApiPackageAcquisitionModuleForBrowserOptions = {
  /** Absolute or repo-relative path to the module entrypoint. */
  entrypoint: string;
  /** Repository root used to resolve relative entrypoints. Defaults to cwd. */
  repoRoot?: string;
};

/**
 * Attempt a browser-targeted ESM bundle of an acquisition module entrypoint.
 */
export async function bundleApiPackageAcquisitionModuleForBrowser(
  options: BundleApiPackageAcquisitionModuleForBrowserOptions,
): Promise<ApiPackageAcquisitionBrowserBundleAttempt> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const absoluteEntrypoint = resolve(repoRoot, options.entrypoint);

  try {
    const result = await Bun.build({
      entrypoints: [absoluteEntrypoint],
      target: "browser",
      format: "esm",
    });

    if (!result.success) {
      return {
        entrypoint: options.entrypoint,
        success: false,
        bundleText: "",
        failureMessages: result.logs.map((log) => String(log)),
      };
    }

    const bundleText = (
      await Promise.all(result.outputs.map((output) => output.text()))
    ).join("\n");

    return {
      entrypoint: options.entrypoint,
      success: true,
      bundleText,
      failureMessages: [],
    };
  } catch (error) {
    // Bun may throw AggregateError (instead of returning success:false) when
    // browser polyfills cannot satisfy Node builtins such as `node:url`.
    const failureMessages: string[] = [];
    if (error instanceof AggregateError && Array.isArray(error.errors)) {
      for (const nested of error.errors) {
        failureMessages.push(
          nested instanceof Error ? nested.message : String(nested),
        );
      }
    }
    if (failureMessages.length === 0) {
      failureMessages.push(
        error instanceof Error ? error.message : String(error),
      );
    }

    return {
      entrypoint: options.entrypoint,
      success: false,
      bundleText: "",
      failureMessages,
    };
  }
}
