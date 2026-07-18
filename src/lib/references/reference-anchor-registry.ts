/**
 * Deterministic URL-safe anchor registry for W04 normalized reference items.
 *
 * Pure build-time helpers — no filesystem, package resolution, or UI. Maps
 * operation IDs, schema pointers, command paths, tool names, symbols, and
 * event types to fragment identifiers registered against an owning page.
 * Registration fails closed when two distinct items on the same owning page
 * would share an anchor fragment.
 */

/** Identity kinds the registry can turn into URL-safe anchors. */
export const REFERENCE_ANCHOR_KINDS = [
  "operation",
  "schema-pointer",
  "command",
  "tool",
  "symbol",
  "event",
] as const;

export type ReferenceAnchorKind = (typeof REFERENCE_ANCHOR_KINDS)[number];

const REFERENCE_ANCHOR_KIND_SET = new Set<string>(REFERENCE_ANCHOR_KINDS);

export function isReferenceAnchorKind(
  value: unknown,
): value is ReferenceAnchorKind {
  return typeof value === "string" && REFERENCE_ANCHOR_KIND_SET.has(value);
}

/**
 * One registered anchor entry. Grouped by owning page so later collision
 * checks and projections can list page-local fragments.
 */
export type RegisteredReferenceAnchor = {
  owningPageId: string;
  itemId: string;
  kind: ReferenceAnchorKind;
  /** Raw identity that produced the anchor (operationId, pointer, …). */
  identity: string;
  /** URL fragment without `#` (for example `submitWorkBySessionId`). */
  anchor: string;
};

export type ReferenceAnchorRegistryErrorCode =
  | "malformed-input"
  | "unsupported-kind"
  | "unknown-entry"
  | "anchor-collision";

export class ReferenceAnchorRegistryError extends Error {
  readonly code: ReferenceAnchorRegistryErrorCode;
  readonly field?: string;
  readonly owningPageId?: string;
  readonly itemId?: string;
  readonly kind?: ReferenceAnchorKind;
  /** Colliding fragment when `code` is `anchor-collision`. */
  readonly anchor?: string;
  /** Other item id already holding the colliding fragment. */
  readonly collidingItemId?: string;

  constructor(
    code: ReferenceAnchorRegistryErrorCode,
    message: string,
    options: {
      field?: string;
      owningPageId?: string;
      itemId?: string;
      kind?: ReferenceAnchorKind;
      anchor?: string;
      collidingItemId?: string;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "ReferenceAnchorRegistryError";
    this.code = code;
    this.field = options.field;
    this.owningPageId = options.owningPageId;
    this.itemId = options.itemId;
    this.kind = options.kind;
    this.anchor = options.anchor;
    this.collidingItemId = options.collidingItemId;
  }
}

export type RegisterReferenceAnchorInput = {
  /** Owning page identity (for example `api` or `/docs/references/api`). */
  owningPageId: string;
  /** Stable item identity within that page. */
  itemId: string;
  kind: ReferenceAnchorKind;
  /** Raw identity used to derive the anchor. */
  identity: string;
};

/**
 * Build a deterministic URL-safe fragment from a raw identity string.
 * Unreserved RFC 3986 fragment characters (`A-Z a-z 0-9 - . _ ~`) are kept;
 * other runs collapse to a single `-`.
 */
export function buildUrlSafeAnchor(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new ReferenceAnchorRegistryError(
      "malformed-input",
      "Cannot build a URL-safe anchor from an empty identity string.",
      { field: "identity" },
    );
  }

  const slug = trimmed
    .replace(/[^A-Za-z0-9._~-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length === 0) {
    throw new ReferenceAnchorRegistryError(
      "malformed-input",
      `Cannot build a URL-safe anchor from identity "${raw}".`,
      { field: "identity" },
    );
  }

  return slug;
}

/**
 * Normalize a JSON Pointer (or `#/…` ref form) into a slug-friendly identity
 * before URL-safe encoding (for example `/components/schemas/Foo` →
 * `components/schemas/Foo`).
 */
export function normalizeSchemaPointerIdentity(pointer: string): string {
  const trimmed = pointer.trim();
  if (trimmed.length === 0) {
    throw new ReferenceAnchorRegistryError(
      "malformed-input",
      "Cannot build a schema-pointer anchor from an empty pointer.",
      { field: "identity", kind: "schema-pointer" },
    );
  }

  let normalized = trimmed;
  if (normalized.startsWith("#")) {
    normalized = normalized.slice(1);
  }
  if (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }

  if (normalized.length === 0) {
    throw new ReferenceAnchorRegistryError(
      "malformed-input",
      `Cannot build a schema-pointer anchor from pointer "${pointer}".`,
      { field: "identity", kind: "schema-pointer" },
    );
  }

  return normalized;
}

/**
 * Deterministic URL-safe anchor for a given identity kind.
 * Identical `(kind, identity)` inputs always produce the same fragment.
 */
export function anchorForIdentity(
  kind: ReferenceAnchorKind,
  identity: string,
): string {
  if (!isReferenceAnchorKind(kind)) {
    throw new ReferenceAnchorRegistryError(
      "unsupported-kind",
      `Unsupported reference anchor kind: ${String(kind)}.`,
      { field: "kind" },
    );
  }

  switch (kind) {
    case "schema-pointer":
      return buildUrlSafeAnchor(normalizeSchemaPointerIdentity(identity));
    case "operation":
    case "command":
    case "tool":
    case "symbol":
    case "event":
      return buildUrlSafeAnchor(identity);
  }
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ReferenceAnchorRegistryError(
      "malformed-input",
      `Malformed registration: field "${field}" must be a non-empty string.`,
      { field },
    );
  }
  return value.trim();
}

function pageKey(owningPageId: string, itemId: string): string {
  return `${owningPageId}\0${itemId}`;
}

/**
 * Build-time registry that maps addressable reference identities to URL-safe
 * anchors, grouped by owning page. Fails closed on per-page fragment collisions.
 */
export class ReferenceAnchorRegistry {
  private readonly byPageAndItem = new Map<string, RegisteredReferenceAnchor>();
  private readonly byPage = new Map<
    string,
    Map<string, RegisteredReferenceAnchor>
  >();
  /** Per owning page: anchor fragment → itemId that owns it. */
  private readonly byPageAndAnchor = new Map<string, Map<string, string>>();

  /**
   * Register (or idempotently re-register) an item against an owning page and
   * return its deterministic URL-safe anchor fragment.
   *
   * Fails closed when a distinct item on the same page would share the
   * fragment, or when the same itemId is re-registered with a different
   * kind/identity/anchor payload.
   */
  register(input: RegisterReferenceAnchorInput): string {
    const owningPageId = requireNonEmptyString(
      input.owningPageId,
      "owningPageId",
    );
    const itemId = requireNonEmptyString(input.itemId, "itemId");
    if (!isReferenceAnchorKind(input.kind)) {
      throw new ReferenceAnchorRegistryError(
        "unsupported-kind",
        `Unsupported reference anchor kind: ${String(input.kind)}.`,
        {
          field: "kind",
          owningPageId,
          itemId,
        },
      );
    }
    const identity = requireNonEmptyString(input.identity, "identity");
    const anchor = anchorForIdentity(input.kind, identity);

    const entry: RegisteredReferenceAnchor = {
      owningPageId,
      itemId,
      kind: input.kind,
      identity,
      anchor,
    };

    const key = pageKey(owningPageId, itemId);
    const existing = this.byPageAndItem.get(key);
    if (existing !== undefined) {
      // Idempotent same-item re-register: identical payload is a no-op.
      if (
        existing.anchor === entry.anchor &&
        existing.kind === entry.kind &&
        existing.identity === entry.identity
      ) {
        return existing.anchor;
      }
      throw new ReferenceAnchorRegistryError(
        "anchor-collision",
        `Anchor collision on owning page "${owningPageId}": item "${itemId}" is already registered with anchor "${existing.anchor}" (kind=${existing.kind}, identity="${existing.identity}"); refusing re-registration with anchor "${entry.anchor}" (kind=${entry.kind}, identity="${entry.identity}").`,
        {
          owningPageId,
          itemId,
          kind: entry.kind,
          anchor: entry.anchor,
          collidingItemId: itemId,
        },
      );
    }

    let anchorIndex = this.byPageAndAnchor.get(owningPageId);
    if (anchorIndex === undefined) {
      anchorIndex = new Map();
      this.byPageAndAnchor.set(owningPageId, anchorIndex);
    }
    const occupantItemId = anchorIndex.get(anchor);
    if (occupantItemId !== undefined && occupantItemId !== itemId) {
      throw new ReferenceAnchorRegistryError(
        "anchor-collision",
        `Anchor collision on owning page "${owningPageId}": fragment "${anchor}" is claimed by both item "${occupantItemId}" and item "${itemId}".`,
        {
          owningPageId,
          itemId,
          kind: entry.kind,
          anchor,
          collidingItemId: occupantItemId,
        },
      );
    }

    this.byPageAndItem.set(key, entry);
    let pageMap = this.byPage.get(owningPageId);
    if (pageMap === undefined) {
      pageMap = new Map();
      this.byPage.set(owningPageId, pageMap);
    }
    pageMap.set(itemId, entry);
    anchorIndex.set(anchor, itemId);
    return entry.anchor;
  }

  get(
    owningPageId: string,
    itemId: string,
  ): RegisteredReferenceAnchor | undefined {
    return this.byPageAndItem.get(pageKey(owningPageId, itemId));
  }

  getAnchor(owningPageId: string, itemId: string): string | undefined {
    return this.get(owningPageId, itemId)?.anchor;
  }

  /**
   * List registered entries for one owning page in stable itemId order.
   */
  listPage(owningPageId: string): readonly RegisteredReferenceAnchor[] {
    const pageMap = this.byPage.get(owningPageId);
    if (pageMap === undefined) {
      return [];
    }
    return [...pageMap.values()].sort((a, b) =>
      a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0,
    );
  }

  /**
   * Snapshot of every registered page id in lexicographic order.
   */
  listOwningPages(): readonly string[] {
    return [...this.byPage.keys()].sort();
  }

  /**
   * Plain-object snapshot suitable for JSON serialization / diagnostics.
   */
  toJSON(): {
    pages: Record<string, RegisteredReferenceAnchor[]>;
  } {
    const pages: Record<string, RegisteredReferenceAnchor[]> = {};
    for (const pageId of this.listOwningPages()) {
      pages[pageId] = this.listPage(pageId).map((entry) => ({ ...entry }));
    }
    return { pages };
  }
}

export function createReferenceAnchorRegistry(): ReferenceAnchorRegistry {
  return new ReferenceAnchorRegistry();
}
