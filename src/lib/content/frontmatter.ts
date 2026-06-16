export type ParsedContentFile = {
  frontmatter: Record<string, unknown>;
  body: string;
};

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (/^-?\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return Number.parseFloat(trimmed);
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function setNestedValue(
  target: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  let current = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    const existing = current[segment];
    if (
      typeof existing !== "object" ||
      existing === null ||
      Array.isArray(existing)
    ) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[path[path.length - 1]] = value;
}

/**
 * Parses a minimal YAML-style frontmatter block used by starter content fixtures.
 * Supports scalar values, inline arrays, and dotted keys such as search.include.
 */
export function parseFrontmatterBlock(yaml: string): Record<string, unknown> {
  const frontmatter: Record<string, unknown> = {};
  const lines = yaml.replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }

    const arrayMatch = /^([^:]+):\s*$/.exec(trimmed);
    if (arrayMatch) {
      const key = arrayMatch[1].trim();
      const values: string[] = [];
      index += 1;

      while (index < lines.length) {
        const itemLine = lines[index].trim();
        if (!itemLine.startsWith("- ")) {
          break;
        }
        values.push(itemLine.slice(2).trim());
        index += 1;
      }

      setNestedValue(frontmatter, key.split("."), values.map(parseScalar));
      continue;
    }

    const scalarMatch = /^([^:]+):\s*(.+)$/.exec(trimmed);
    if (scalarMatch) {
      const key = scalarMatch[1].trim();
      const value = parseScalar(scalarMatch[2]);
      setNestedValue(frontmatter, key.split("."), value);
    }

    index += 1;
  }

  return frontmatter;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** Splits a markdown or MDX source file into frontmatter metadata and body content. */
export function parseContentFile(source: string): ParsedContentFile {
  const match = FRONTMATTER_PATTERN.exec(source);
  if (!match) {
    return {
      frontmatter: {},
      body: source,
    };
  }

  return {
    frontmatter: parseFrontmatterBlock(match[1]),
    body: match[2],
  };
}
