# MCP Installation Foundation Relevant Files

- `src/content/docs/mcp-installation/en.mdx` is the canonical-locale source for the MCP guide. For this docs system, published guide participation comes from content frontmatter, not route registration or shell-only wiring.
- `src/content/docs/{configuration,concepts,coder-reviewer-pattern}/en.mdx` defines adjacent guide ordering through `section` and `order`. When a new guide needs coherent placement, move the surrounding content metadata rather than adding special-case navigation logic.
- `src/lib/content/load-doc-page.ts`, `src/lib/content/load-docs-navigation.ts`, `src/lib/content/load-search-documents.ts`, and `src/lib/content/load-search-artifact.ts` are the core content-pipeline seams for a single docs page. Use them together when a lane needs proof that authored content loads, projects into generated navigation, and participates in search metadata.
- `public/search/public-search-index.json` is a checked-in deterministic artifact. Any new searchable published doc must regenerate it through `bun run generate:search-index` or the content-validation gate will fail on artifact drift.
