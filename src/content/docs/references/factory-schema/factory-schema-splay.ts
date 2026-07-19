/**
 * Page-local Factory schema `$ref` closure splay helpers.
 *
 * Walks W04 definition/field addresses reachable from the Factory root so the
 * page can render referenced `$defs` as expanded SchemaDefinition sections.
 * Cycle-safe (visited set); missing / unresolved addresses are skipped rather
 * than inventing definitions. Pure — no IO / React.
 */

import {
  formatSchemaAddress,
  type SchemaAdditionalPropertiesModel,
  type SchemaAddress,
  type SchemaCompositionModel,
  type SchemaDefinitionModel,
  type SchemaFieldModel,
} from "@/lib/references/schema-model";

function addressKey(address: SchemaAddress): string {
  return formatSchemaAddress(address);
}

/** True when a nested `$defs` entry is a bare address stub (not a full model). */
function isSchemaAddressOnly(
  value: SchemaDefinitionModel | SchemaAddress,
): value is SchemaAddress {
  return !("address" in value);
}

function pushAddress(
  address: SchemaAddress | undefined,
  into: SchemaAddress[],
): void {
  if (address !== undefined) {
    into.push(address);
  }
}

function pushAdditionalProperties(
  value: SchemaAdditionalPropertiesModel | undefined,
  into: SchemaAddress[],
): void {
  if (typeof value === "object") {
    into.push(value);
  }
}

function collectCompositionAddresses(
  composition: SchemaCompositionModel | undefined,
  into: SchemaAddress[],
): void {
  if (composition === undefined) {
    return;
  }
  for (const member of composition.oneOf ?? []) {
    into.push(member);
  }
  for (const member of composition.anyOf ?? []) {
    into.push(member);
  }
  for (const member of composition.allOf ?? []) {
    into.push(member);
  }
  const mapping = composition.discriminator?.mapping;
  if (mapping !== undefined) {
    for (const target of Object.values(mapping)) {
      into.push(target);
    }
  }
}

function collectFieldAddresses(
  field: SchemaFieldModel,
  into: SchemaAddress[],
): void {
  pushAddress(field.refTarget, into);
  pushAddress(field.itemSchema, into);
  pushAdditionalProperties(field.additionalProperties, into);
  if (field.childTargets !== undefined) {
    for (const child of Object.values(field.childTargets)) {
      into.push(child);
    }
  }
}

/**
 * Collect every schema address this definition points at (one hop).
 * Does not invent addresses or follow targets.
 */
export function collectSchemaDefinitionOutboundAddresses(
  definition: SchemaDefinitionModel,
): SchemaAddress[] {
  const into: SchemaAddress[] = [];
  pushAddress(definition.refTarget, into);
  pushAdditionalProperties(definition.additionalProperties, into);
  collectCompositionAddresses(definition.composition, into);

  if (definition.items !== undefined && isSchemaAddressOnly(definition.items)) {
    into.push(definition.items);
  }

  if (definition.properties !== undefined) {
    for (const field of Object.values(definition.properties)) {
      collectFieldAddresses(field, into);
    }
  }

  if (definition.definitions !== undefined) {
    for (const nested of Object.values(definition.definitions)) {
      if (isSchemaAddressOnly(nested)) {
        into.push(nested);
        continue;
      }
      into.push(nested.address);
      into.push(...collectSchemaDefinitionOutboundAddresses(nested));
    }
  }

  return into;
}

function indexCatalog(
  catalog: readonly SchemaDefinitionModel[],
): Map<string, SchemaDefinitionModel> {
  const byKey = new Map<string, SchemaDefinitionModel>();
  for (const definition of catalog) {
    byKey.set(addressKey(definition.address), definition);
  }
  return byKey;
}

/**
 * Recursively collect catalog definitions reachable from `root` via `$ref`,
 * item schemas, composition members, and nested definition addresses.
 *
 * - Returns definitions in deterministic pointer-sorted order (excluding root).
 * - Cycles are skipped via a visited set (no infinite walk).
 * - Missing catalog targets are omitted (fail-closed; no invented defs).
 */
export function collectFactorySchemaSplayDefinitions(
  root: SchemaDefinitionModel,
  catalog: readonly SchemaDefinitionModel[],
): SchemaDefinitionModel[] {
  const byKey = indexCatalog(catalog);
  // Ensure nested full models on the root are also resolvable if present.
  byKey.set(addressKey(root.address), root);
  if (root.definitions !== undefined) {
    for (const nested of Object.values(root.definitions)) {
      if ("address" in nested) {
        byKey.set(addressKey(nested.address), nested);
      }
    }
  }

  const visited = new Set<string>();
  const queue: SchemaAddress[] = [root.address];
  const splayed = new Map<string, SchemaDefinitionModel>();

  while (queue.length > 0) {
    const next = queue.pop();
    if (next === undefined) {
      continue;
    }
    const key = addressKey(next);
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    const definition = byKey.get(key);
    if (definition === undefined) {
      // Missing / unresolved — keep fail-closed chrome; do not invent.
      continue;
    }

    if (key !== addressKey(root.address)) {
      splayed.set(key, definition);
    }

    for (const outbound of collectSchemaDefinitionOutboundAddresses(
      definition,
    )) {
      const outboundKey = addressKey(outbound);
      if (!visited.has(outboundKey)) {
        queue.push(outbound);
      }
    }
  }

  return [...splayed.values()].sort((a, b) =>
    a.address.pointer.localeCompare(b.address.pointer),
  );
}
