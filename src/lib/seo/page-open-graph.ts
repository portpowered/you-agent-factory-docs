import type { Metadata } from "next";
import {
  defaultSocialOpenGraphImages,
  defaultSocialTwitter,
} from "@/lib/seo/social-preview-assets";

export type PageOpenGraphInput = {
  title: string;
  description: string;
  /**
   * App-relative canonical path for this page. Keep unprefixed — root
   * `metadataBase` resolves it to the production absolute URL (same as
   * `rel=canonical`).
   */
  url: string;
};

/**
 * Builds page-specific Open Graph fields that mirror title/description and the
 * page canonical path, plus the default social preview image (app-relative).
 * Factory copy only — callers must pass the same strings used for Metadata
 * `title` / `description`.
 */
export function pageOpenGraph(
  input: PageOpenGraphInput,
): NonNullable<Metadata["openGraph"]> {
  return {
    title: input.title,
    description: input.description,
    url: input.url,
    images: defaultSocialOpenGraphImages(),
  };
}

function canonicalHrefToAppPath(
  canonical: NonNullable<Metadata["alternates"]>["canonical"],
): string | undefined {
  if (typeof canonical === "string") {
    return canonical;
  }
  if (canonical instanceof URL) {
    return `${canonical.pathname}${canonical.search}`;
  }
  return undefined;
}

/**
 * Attaches Open Graph title/description/url/images that match the page
 * Metadata title, description, and alternates.canonical, plus default Twitter
 * card fields referencing the shared social preview image.
 */
export function withPageOpenGraph<
  T extends {
    title: string;
    description: string;
    alternates?: Metadata["alternates"];
  },
>(
  metadata: T,
): T & {
  openGraph: NonNullable<Metadata["openGraph"]>;
  twitter: {
    card: "summary_large_image";
    images: NonNullable<NonNullable<Metadata["twitter"]>["images"]>;
  };
} {
  const url = canonicalHrefToAppPath(metadata.alternates?.canonical);
  const twitter = defaultSocialTwitter();
  if (url === undefined) {
    return {
      ...metadata,
      openGraph: {
        title: metadata.title,
        description: metadata.description,
        images: defaultSocialOpenGraphImages(),
      },
      twitter,
    };
  }

  return {
    ...metadata,
    openGraph: pageOpenGraph({
      title: metadata.title,
      description: metadata.description,
      url,
    }),
    twitter,
  };
}
