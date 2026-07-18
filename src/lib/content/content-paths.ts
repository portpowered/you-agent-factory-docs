/**
 * Canonical filesystem paths for committed content and generated runtime artifacts.
 *
 * **Derived page directory contract.** Ordinary canonical docs pages live under
 * `src/content/docs/<section>/<slug>`. Callers should resolve a page directory with
 * {@link getDocsPageDir} from a {@link DocsSection} and slug instead of importing
 * page-specific exported constants. Shared roots ({@link getDocsRoot},
 * {@link getRegistryRoot}, {@link getMessagesRoot}, generated roots) and section
 * roots ({@link getDocsSectionRoot}, `get*DocsRoot`) remain the stable surface for
 * section-wide or tree-wide operations.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(
  dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
);

/** Repository root inferred from this module so helper imports remain stable outside repo cwd. */
export function getProjectRoot(): string {
  return REPO_ROOT;
}

/** Committed content tree root (`src/content`). */
export function getContentRoot(projectRoot = getProjectRoot()): string {
  return join(projectRoot, "src/content");
}

/** Published docs pages under `src/content/docs`. */
export function getDocsRoot(contentRoot = getContentRoot()): string {
  return join(contentRoot, "docs");
}

/** Narrative blog posts under `src/content/blog`. */
export function getBlogRoot(contentRoot = getContentRoot()): string {
  return join(contentRoot, "blog");
}

/** Blog post bundle under `src/content/blog/<slug>`. */
export function getBlogPageDir(slug: string, blogRoot = getBlogRoot()): string {
  return join(blogRoot, slug);
}

/** Supported canonical docs sections under `src/content/docs`. */
export const DOCS_SECTIONS = [
  "guides",
  "concepts",
  "techniques",
  "documentation",
  "glossary",
  "references",
  "factories",
  "workers",
  "workstations",
] as const;

/** Canonical docs section identifier for derived page directory lookup. */
export type DocsSection = (typeof DOCS_SECTIONS)[number];

/** Supported docs sections keyed to the canonical content tree. */
const docsSectionPaths: Record<DocsSection, string> = {
  guides: "guides",
  concepts: "concepts",
  techniques: "techniques",
  documentation: "documentation",
  glossary: "glossary",
  references: "references",
  factories: "factories",
  workers: "workers",
  workstations: "workstations",
};

/** Docs section root under `src/content/docs/<section>`. */
export function getDocsSectionRoot(
  section: DocsSection,
  docsRoot = getDocsRoot(),
): string {
  return join(docsRoot, docsSectionPaths[section]);
}

/**
 * Derived docs page directory under `src/content/docs/<section>/<slug>`.
 *
 * Use this for ordinary canonical page bundles (guide, concept, technique,
 * documentation, or glossary). Do not add new page-specific exported constants
 * for routine page additions; pass the section and slug here instead.
 */
export function getDocsPageDir(
  section: DocsSection,
  slug: string,
  docsRoot = getDocsRoot(),
): string {
  return join(getDocsSectionRoot(section, docsRoot), slug);
}

/** Glossary docs under `src/content/docs/glossary`. */
export function getGlossaryDocsRoot(docsRoot = getDocsRoot()): string {
  return getDocsSectionRoot("glossary", docsRoot);
}

/** Guide docs under `src/content/docs/guides`. */
export function getGuidesDocsRoot(docsRoot = getDocsRoot()): string {
  return getDocsSectionRoot("guides", docsRoot);
}

/** Concept docs under `src/content/docs/concepts`. */
export function getConceptsDocsRoot(docsRoot = getDocsRoot()): string {
  return getDocsSectionRoot("concepts", docsRoot);
}

/** Technique docs under `src/content/docs/techniques`. */
export function getTechniquesDocsRoot(docsRoot = getDocsRoot()): string {
  return getDocsSectionRoot("techniques", docsRoot);
}

/** Documentation docs under `src/content/docs/documentation`. */
export function getDocumentationDocsRoot(docsRoot = getDocsRoot()): string {
  return getDocsSectionRoot("documentation", docsRoot);
}

/** Registry JSON under `src/content/registry`. */
export function getRegistryRoot(contentRoot = getContentRoot()): string {
  return join(contentRoot, "registry");
}

export const REGISTRY_COLLECTIONS = [
  "citations",
  "classifications",
  "concepts",
  "datasets",
  "documentation",
  "graphs",
  "guides",
  "organizations",
  "tables",
  "tags",
  "techniques",
] as const;

export type RegistryCollection = (typeof REGISTRY_COLLECTIONS)[number];

/** Supported registry collection root under `src/content/registry/<collection>`. */
export function getRegistryCollectionRoot(
  collection: RegistryCollection,
  registryRoot = getRegistryRoot(),
): string {
  return join(registryRoot, collection);
}

/** Generated content runtime artifacts under `src/lib/content/generated`. */
export function getGeneratedContentRuntimeRoot(
  projectRoot = getProjectRoot(),
): string {
  return join(projectRoot, "src", "lib", "content", "generated");
}

/** Generated Fumadocs bindings under `.source`. */
export function getGeneratedDocsSourceRoot(
  projectRoot = getProjectRoot(),
): string {
  return join(projectRoot, ".source");
}

/** Site-wide UI messages under `src/content/messages`. */
export function getMessagesRoot(contentRoot = getContentRoot()): string {
  return join(contentRoot, "messages");
}

/** Localized tag copy under `src/content/registry/tags/messages`. */
export function getTagMessagesRoot(registryRoot = getRegistryRoot()): string {
  return join(getRegistryCollectionRoot("tags", registryRoot), "messages");
}

const contentRoot = getContentRoot();

/** Default `src/content` root for production loaders. */
export const CONTENT_ROOT = contentRoot;

/** Default `src/content/blog` root. */
export const BLOG_ROOT = getBlogRoot(contentRoot);

/** Default `src/content/docs` root for page discovery. */
export const DOCS_ROOT = getDocsRoot(contentRoot);

/** Default `src/content/docs/glossary` root. */
export const GLOSSARY_DOCS_ROOT = getGlossaryDocsRoot(DOCS_ROOT);

/** Default `src/content/docs/guides` root. */
export const GUIDES_DOCS_ROOT = getGuidesDocsRoot(DOCS_ROOT);

/** Default `src/content/docs/concepts` root. */
export const CONCEPTS_DOCS_ROOT = getConceptsDocsRoot(DOCS_ROOT);

/** Default `src/content/docs/techniques` root. */
export const TECHNIQUES_DOCS_ROOT = getTechniquesDocsRoot(DOCS_ROOT);

/** Default `src/content/docs/documentation` root. */
export const DOCUMENTATION_DOCS_ROOT = getDocumentationDocsRoot(DOCS_ROOT);

/** Default `src/content/registry` root. */
export const REGISTRY_ROOT = getRegistryRoot(contentRoot);

/** Default generated content runtime artifact root. */
export const GENERATED_CONTENT_RUNTIME_ROOT = getGeneratedContentRuntimeRoot();

/** Default generated Fumadocs bindings root. */
export const GENERATED_DOCS_SOURCE_ROOT = getGeneratedDocsSourceRoot();

/** Default `src/content/messages` root. */
export const MESSAGES_ROOT = getMessagesRoot(contentRoot);

/** Default `src/content/registry/tags/messages` root. */
export const TAG_MESSAGES_ROOT = getTagMessagesRoot(REGISTRY_ROOT);
