/** One in-page heading projected from docs page body structure. */
export type DocsPageOutlineHeading = {
  level: number;
  text: string;
  id: string;
};

/** Projected in-page outline consumed by the docs page UI. */
export type DocsPageOutline = {
  headings: DocsPageOutlineHeading[];
};

export type DocPageBodyHeadingBlock = {
  type: "heading";
  level: number;
  text: string;
  id: string;
};

export type DocPageBodyParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type DocPageBodyBlock =
  | DocPageBodyHeadingBlock
  | DocPageBodyParagraphBlock;

/** Parsed docs page body blocks and outline headings derived from page structure. */
export type ParsedDocPageBody = {
  blocks: DocPageBodyBlock[];
  outlineHeadings: DocsPageOutlineHeading[];
};

const ATX_HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;
const MIN_OUTLINE_HEADING_LEVEL = 2;

function slugifyHeadingText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function assignHeadingIds(blocks: DocPageBodyBlock[]): void {
  const idCounts = new Map<string, number>();

  for (const block of blocks) {
    if (block.type !== "heading") {
      continue;
    }

    const baseId = slugifyHeadingText(block.text) || "section";
    const count = idCounts.get(baseId) ?? 0;
    idCounts.set(baseId, count + 1);
    block.id = count === 0 ? baseId : `${baseId}-${count}`;
  }
}

/**
 * Parses docs page body markdown into renderable blocks and outline headings.
 * Outline headings are limited to h2+ so the page title remains the single h1.
 */
export function parseDocPageBody(body: string): ParsedDocPageBody {
  const blocks: DocPageBodyBlock[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    const text = paragraphLines.join("\n").trim();
    if (text) {
      blocks.push({ type: "paragraph", text });
    }
    paragraphLines = [];
  };

  for (const line of body.split("\n")) {
    const match = line.match(ATX_HEADING_PATTERN);
    if (match) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: match[1].length,
        text: match[2].trim(),
        id: "",
      });
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  assignHeadingIds(blocks);

  const outlineHeadings = blocks
    .filter(
      (block): block is DocPageBodyHeadingBlock =>
        block.type === "heading" && block.level >= MIN_OUTLINE_HEADING_LEVEL,
    )
    .map(({ level, text, id }) => ({ level, text, id }));

  return { blocks, outlineHeadings };
}

/**
 * Projects the first in-page outline from parsed docs page body structure.
 * Pages without h2+ headings return an empty outline instead of broken UI.
 */
export function projectDocsPageOutline(
  parsed: ParsedDocPageBody,
): DocsPageOutline {
  return {
    headings: parsed.outlineHeadings,
  };
}
