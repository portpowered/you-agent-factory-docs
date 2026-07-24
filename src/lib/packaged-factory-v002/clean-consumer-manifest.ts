/**
 * Pure temporary-consumer package.json builder for the packaged-factory 0.0.2
 * family install proof.
 *
 * Fail-closed against overrides / resolutions / link redirects so the clean
 * consumer cannot quietly substitute local or mixed trees.
 */

import {
  buildPackagedFactoryV002ExactPins,
  PACKAGED_FACTORY_V002_PACKAGE_NAMES,
  PACKAGED_FACTORY_V002_VERSION,
  type PackagedFactoryV002ExactPins,
} from "./five-package-pins";

/** Keys that would redirect or substitute registry installs. */
export const FORBIDDEN_CONSUMER_MANIFEST_KEYS = [
  "overrides",
  "resolutions",
  "pnpm",
  "workspaces",
] as const;

export type CleanConsumerManifest = {
  name: string;
  private: true;
  version: string;
  dependencies: PackagedFactoryV002ExactPins;
};

export class CleanConsumerManifestError extends Error {
  readonly code: "forbidden-key" | "version-drift" | "link-redirect";

  constructor(code: CleanConsumerManifestError["code"], message: string) {
    super(message);
    this.name = "CleanConsumerManifestError";
    this.code = code;
  }
}

export function buildCleanConsumerManifest(
  dependencies: PackagedFactoryV002ExactPins = buildPackagedFactoryV002ExactPins(),
): CleanConsumerManifest {
  assertNoLinkRedirects(dependencies);
  assertExactPackagedFactoryV002Pins(dependencies);

  return {
    name: "packaged-factory-v002-clean-consumer",
    private: true,
    version: "0.0.0",
    dependencies,
  };
}

/**
 * Assert a consumer package.json document is a clean exact-pin install surface:
 * five packages at 0.0.2, no overrides/resolutions/workspaces, no link: deps.
 */
export function assertCleanConsumerManifestDocument(
  document: unknown,
): asserts document is CleanConsumerManifest {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new CleanConsumerManifestError(
      "forbidden-key",
      "Clean consumer package.json must be a JSON object.",
    );
  }

  const record = document as Record<string, unknown>;

  for (const key of FORBIDDEN_CONSUMER_MANIFEST_KEYS) {
    if (key in record) {
      throw new CleanConsumerManifestError(
        "forbidden-key",
        `Clean consumer package.json must not declare "${key}" (no overrides, resolutions, or workspace redirects).`,
      );
    }
  }

  const dependencies = record.dependencies;
  if (
    !dependencies ||
    typeof dependencies !== "object" ||
    Array.isArray(dependencies)
  ) {
    throw new CleanConsumerManifestError(
      "version-drift",
      "Clean consumer package.json must declare a dependencies object.",
    );
  }

  assertNoLinkRedirects(dependencies as Record<string, unknown>);
  assertExactPackagedFactoryV002Pins(dependencies as Record<string, unknown>);
}

function assertExactPackagedFactoryV002Pins(
  dependencies: Record<string, unknown>,
): asserts dependencies is PackagedFactoryV002ExactPins {
  for (const name of PACKAGED_FACTORY_V002_PACKAGE_NAMES) {
    const version = dependencies[name];
    if (version !== PACKAGED_FACTORY_V002_VERSION) {
      throw new CleanConsumerManifestError(
        "version-drift",
        `Clean consumer must pin ${name} to exact "${PACKAGED_FACTORY_V002_VERSION}" (observed ${JSON.stringify(version)}).`,
      );
    }
  }
}

function assertNoLinkRedirects(dependencies: Record<string, unknown>): void {
  for (const [name, version] of Object.entries(dependencies)) {
    if (typeof version !== "string") {
      throw new CleanConsumerManifestError(
        "link-redirect",
        `Dependency ${name} must be an exact version string.`,
      );
    }
    if (
      version.startsWith("link:") ||
      version.startsWith("file:") ||
      version.startsWith("workspace:") ||
      version.startsWith("portal:")
    ) {
      throw new CleanConsumerManifestError(
        "link-redirect",
        `Clean consumer must not use link/file/workspace redirects for ${name} (observed ${JSON.stringify(version)}).`,
      );
    }
  }
}
