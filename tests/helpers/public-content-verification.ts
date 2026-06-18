import { join } from "node:path";
import {
  type PublicContentKind,
  buildRoutePath,
  listPublishedPublicContentRouteParams,
  loadPublicContentPage,
} from "../../src/lib/content";

const STARTER_CONTENT_ROOT = join(import.meta.dir, "../../src/content");
const SUPPORTED_PUBLIC_KINDS: Exclude<PublicContentKind, "doc">[] = [
  "blog",
  "glossary",
  "comparison",
  "reference",
];

export type PublicContentVerificationFixture = {
  kind: Exclude<PublicContentKind, "doc">;
  slug: string;
  routePath: string;
  heading: string;
  body: string;
};

function pickRenderableBodyText(markdown: string): string {
  for (const line of markdown.split("\n")) {
    const trimmedLine = line.trim();

    if (trimmedLine.length > 0 && !trimmedLine.startsWith("#")) {
      return trimmedLine;
    }
  }

  return markdown.trim();
}

function asSupportedPublicKind(
  kind: PublicContentKind,
): Exclude<PublicContentKind, "doc"> {
  if (kind === "doc") {
    throw new Error("Docs content is not part of public content verification");
  }

  return kind;
}

export function listPublicContentVerificationFixtures(): PublicContentVerificationFixture[] {
  return listPublishedPublicContentRouteParams(STARTER_CONTENT_ROOT).map(
    ({ kind, slug }) => {
      const supportedKind = asSupportedPublicKind(kind);
      const page = loadPublicContentPage(
        supportedKind,
        slug,
        STARTER_CONTENT_ROOT,
      );

      return {
        kind: supportedKind,
        slug,
        routePath: page.record.routePath,
        heading: page.title,
        body: pickRenderableBodyText(page.body),
      };
    },
  );
}

export function getPublicContentVerificationFixture(
  kind: Exclude<PublicContentKind, "doc">,
): PublicContentVerificationFixture {
  const fixture = listPublicContentVerificationFixtures().find(
    (candidate) => candidate.kind === kind,
  );

  if (!fixture) {
    throw new Error(`Missing public content verification fixture for ${kind}`);
  }

  return fixture;
}

export function listRepresentativeMissingPublicRoutePaths(): string[] {
  return SUPPORTED_PUBLIC_KINDS.map((kind) =>
    buildRoutePath(kind, `missing-${kind}`),
  );
}
