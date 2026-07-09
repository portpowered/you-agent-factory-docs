/** Minimal YAML frontmatter parser for Phase 1 page.mdx headers. */
export function parseYamlFrontmatterBlock(
  block: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = block.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!keyMatch) {
      i += 1;
      continue;
    }
    const [, key, rest] = keyMatch;
    if (rest.length === 0) {
      const items: string[] = [];
      i += 1;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s+-\s+/, "").replace(/^"|"$/g, ""));
        i += 1;
      }
      result[key] = items;
      continue;
    }
    const scalar = rest.replace(/^"|"$/g, "");
    // Real YAML parsers (and next-mdx-remote) treat `[]` as an empty array.
    // Keep the minimal frontmatter parser aligned so empty list fields round-trip.
    if (scalar === "[]") {
      result[key] = [];
      i += 1;
      continue;
    }
    result[key] = scalar;
    i += 1;
  }
  return result;
}
