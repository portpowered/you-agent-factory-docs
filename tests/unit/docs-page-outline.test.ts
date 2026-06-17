import { describe, expect, test } from "bun:test";
import {
  parseDocPageBody,
  projectDocsPageOutline,
} from "../../src/lib/content";

describe("docs page outline projection", () => {
  test("projects in-page outline headings from markdown body structure", () => {
    const parsed = parseDocPageBody(`# Getting started

Intro paragraph.

## Prerequisites

Confirm the worktree is ready.

## Next steps

Continue through the docs sequence.
`);

    expect(projectDocsPageOutline(parsed)).toEqual({
      headings: [
        { level: 2, text: "Prerequisites", id: "prerequisites" },
        { level: 2, text: "Next steps", id: "next-steps" },
      ],
    });
  });

  test("returns an empty outline when the page body has no h2+ headings", () => {
    const parsed = parseDocPageBody(`# Installation

Install locally and verify the contributor command path.
`);

    expect(projectDocsPageOutline(parsed)).toEqual({
      headings: [],
    });
  });

  test("assigns stable anchor ids and nested heading levels for outline links", () => {
    const parsed = parseDocPageBody(`## Overview

Summary.

### Details

More detail.

## Overview

Repeated heading.
`);

    expect(projectDocsPageOutline(parsed)).toEqual({
      headings: [
        { level: 2, text: "Overview", id: "overview" },
        { level: 3, text: "Details", id: "details" },
        { level: 2, text: "Overview", id: "overview-1" },
      ],
    });
  });

  test("parses paragraph blocks while preserving heading ids for rendered anchors", () => {
    const parsed = parseDocPageBody(`## Prerequisites

Confirm setup.

## Next steps

Continue reading.
`);

    expect(parsed.blocks).toEqual([
      {
        type: "heading",
        level: 2,
        text: "Prerequisites",
        id: "prerequisites",
      },
      { type: "paragraph", text: "Confirm setup." },
      { type: "heading", level: 2, text: "Next steps", id: "next-steps" },
      { type: "paragraph", text: "Continue reading." },
    ]);
  });
});
