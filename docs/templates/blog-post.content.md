# Blog Post Template Authoring Guide

Blog posts may contain raw MDX prose because they are narrative content. Use `blog-post.mdx` as a flexible starting point, but still prefer localized messages and asset references when a post must support multiple locales or reusable media.

## Recommended Content

* `title`: post title shown once via renderer `DocsTitle` (do not duplicate with MDX `# <T k="title" />`).
* `description`: subtitle shown once via renderer `DocsDescription` (do not duplicate with a body Summary block).
* `contextSentence`: short context line for the post.
* `takeaway`: optional metadata for search indexing; do not render `## Summary` / `<T k="takeaway" />` in published MDX (duplicates `DocsDescription`).
* Tags: frontmatter `tags` render once via renderer `BlogPostMeta` (do not add `TagPillList` or a bottom `## Tags` section).
* `context`: what changed, what was released, what factory workflow shifted, or what confusion this post addresses.
* `mainIdea`: argument or interpretation.
* `whyItMatters`: practical implication for readers.

## Registry And Links

Blog posts should link back to canonical docs pages instead of duplicating stable definitions. Use `relatedDocIds` for stable docs references and `CitationList` for cited sources.
