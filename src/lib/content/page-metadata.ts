import { PROJECT_NAME } from "@/lib/project";
import { withBasePath } from "@/lib/site";
import type { Metadata } from "next";

type ContentPageMetadataInput = {
  body: string;
  routePath: string;
  title: string;
};

function stripMarkdownToPlainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(^|\n)#{1,6}\s+/g, " ")
    .replace(/(^|\n)>\s+/g, " ")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMetadataDescription(body: string, title: string): string {
  const plainText = stripMarkdownToPlainText(body);

  if (plainText.length === 0) {
    return title;
  }

  return plainText.slice(0, 160).trimEnd();
}

export function buildContentPageMetadata(
  input: ContentPageMetadataInput,
): Metadata {
  return {
    title: `${input.title} | ${PROJECT_NAME}`,
    description: buildMetadataDescription(input.body, input.title),
    alternates: {
      canonical: withBasePath(input.routePath),
    },
  };
}
