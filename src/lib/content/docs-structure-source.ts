import { join } from "node:path";
import {
  type DocsShellNavigationInput,
  projectDocsShellNavigation,
} from "@/lib/content/docs-navigation";
import { projectFumadocsPageTree } from "@/lib/content/fumadocs-page-tree";
import {
  type LoadedStarterContent,
  loadStarterContentRecords,
} from "@/lib/content/load-starter-content";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import type { PageTree } from "fumadocs-core/server";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");

export type DocsContentSource = {
  canonicalRecords: LoadedStarterContent["records"];
  variantBindings: LoadedStarterContent["variantBindings"];
};

export type LoadDocsStructureSourceOptions = {
  locale?: string;
  rootName?: string;
};

export type DocsStructureSource = DocsContentSource & {
  docsRouteNavigation: DocsShellNavigationInput;
  fumadocsPageTree: PageTree.Root;
};

/**
 * Explicit compatibility boundary for the current docs migration.
 *
 * Canonical content records remain the only durable source of truth while the
 * active docs route still needs two projections:
 * - a Fumadocs page tree that owns route layout structure
 * - generated docs-route navigation that powers breadcrumbs and progression
 */
export function loadDocsContentSource(
  contentRoot = DEFAULT_CONTENT_ROOT,
): DocsContentSource {
  const { records, failures, variantBindings } =
    loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  return {
    canonicalRecords: records,
    variantBindings,
  };
}

export function loadDocsStructureSource(
  contentRoot = DEFAULT_CONTENT_ROOT,
  options: LoadDocsStructureSourceOptions = {},
): DocsStructureSource {
  const contentSource = loadDocsContentSource(contentRoot);
  const docsRouteNavigation = projectDocsShellNavigation(
    contentSource.canonicalRecords,
    {
      locale: options.locale,
      variantBindings: contentSource.variantBindings,
    },
  );

  return {
    ...contentSource,
    docsRouteNavigation,
    fumadocsPageTree: projectFumadocsPageTree(docsRouteNavigation, {
      rootName: options.rootName,
    }),
  };
}
