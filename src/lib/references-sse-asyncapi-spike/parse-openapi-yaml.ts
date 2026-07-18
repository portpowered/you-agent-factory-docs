/**
 * Parse OpenAPI YAML text in both Bun unit tests and the Next.js server
 * runtime. Prefer the portable `yaml` package — `Bun.YAML` is unavailable
 * under Next's Node server.
 */

import { parse as parseYaml } from "yaml";

export function parseOpenApiYamlText<T = unknown>(sourceText: string): T {
  return parseYaml(sourceText) as T;
}
