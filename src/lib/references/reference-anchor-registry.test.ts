import { describe, expect, test } from "bun:test";
import {
  anchorForIdentity,
  buildUrlSafeAnchor,
  createReferenceAnchorRegistry,
  isReferenceAnchorKind,
  normalizeSchemaPointerIdentity,
  REFERENCE_ANCHOR_KINDS,
  ReferenceAnchorRegistryError,
} from "./reference-anchor-registry";

describe("REFERENCE_ANCHOR_KINDS", () => {
  test("covers operations, schema pointers, commands, tools, symbols, and events", () => {
    expect([...REFERENCE_ANCHOR_KINDS]).toEqual([
      "operation",
      "schema-pointer",
      "command",
      "tool",
      "symbol",
      "event",
    ]);

    for (const kind of REFERENCE_ANCHOR_KINDS) {
      expect(isReferenceAnchorKind(kind)).toBe(true);
    }
    expect(isReferenceAnchorKind("overlay")).toBe(false);
  });
});

describe("buildUrlSafeAnchor / anchorForIdentity", () => {
  test("builds deterministic URL-safe anchors for each identity kind", () => {
    expect(anchorForIdentity("operation", "submitWorkBySessionId")).toBe(
      "submitWorkBySessionId",
    );
    expect(anchorForIdentity("command", "you config init")).toBe(
      "you-config-init",
    );
    expect(anchorForIdentity("tool", "you.factory_session.get")).toBe(
      "you.factory_session.get",
    );
    expect(anchorForIdentity("symbol", "javascript.log")).toBe(
      "javascript.log",
    );
    expect(anchorForIdentity("event", "RUN_REQUEST")).toBe("RUN_REQUEST");
    expect(
      anchorForIdentity("schema-pointer", "/components/schemas/FactoryEvent"),
    ).toBe("components-schemas-FactoryEvent");
    expect(
      anchorForIdentity("schema-pointer", "#/components/schemas/FactoryEvent"),
    ).toBe("components-schemas-FactoryEvent");
  });

  test("identical inputs produce identical anchors across runs", () => {
    const inputs = [
      ["operation", "submitWorkBySessionId"],
      ["command", "you config init"],
      ["tool", "you.factory_session.get"],
      ["symbol", "log"],
      ["event", "RUN_REQUEST"],
      ["schema-pointer", "/components/schemas/WorkItem"],
    ] as const;

    for (const [kind, identity] of inputs) {
      const first = anchorForIdentity(kind, identity);
      const second = anchorForIdentity(kind, identity);
      expect(first).toBe(second);
      expect(first).toMatch(/^[A-Za-z0-9._~-]+$/);
    }
  });

  test("rejects empty or non-slugifiable identities", () => {
    expect(() => buildUrlSafeAnchor("")).toThrow(ReferenceAnchorRegistryError);
    expect(() => buildUrlSafeAnchor("   ")).toThrow(
      ReferenceAnchorRegistryError,
    );
    expect(() => buildUrlSafeAnchor("!!!")).toThrow(
      ReferenceAnchorRegistryError,
    );
    expect(() => normalizeSchemaPointerIdentity("#/")).toThrow(
      ReferenceAnchorRegistryError,
    );
  });
});

describe("ReferenceAnchorRegistry", () => {
  test("registers items against an owning page and returns deterministic anchors", () => {
    const registry = createReferenceAnchorRegistry();

    const operationAnchor = registry.register({
      owningPageId: "api",
      itemId: "openapi.operation.submitWorkBySessionId",
      kind: "operation",
      identity: "submitWorkBySessionId",
    });
    const schemaAnchor = registry.register({
      owningPageId: "schema",
      itemId: "schema.FactoryEvent",
      kind: "schema-pointer",
      identity: "/components/schemas/FactoryEvent",
    });
    const commandAnchor = registry.register({
      owningPageId: "cli",
      itemId: "cli.you.config.init",
      kind: "command",
      identity: "you config init",
    });
    const toolAnchor = registry.register({
      owningPageId: "mcp",
      itemId: "mcp.you.factory_session.get",
      kind: "tool",
      identity: "you.factory_session.get",
    });
    const symbolAnchor = registry.register({
      owningPageId: "javascript",
      itemId: "javascript.log",
      kind: "symbol",
      identity: "log",
    });
    const eventAnchor = registry.register({
      owningPageId: "events",
      itemId: "events.RUN_REQUEST",
      kind: "event",
      identity: "RUN_REQUEST",
    });

    expect(operationAnchor).toBe("submitWorkBySessionId");
    expect(schemaAnchor).toBe("components-schemas-FactoryEvent");
    expect(commandAnchor).toBe("you-config-init");
    expect(toolAnchor).toBe("you.factory_session.get");
    expect(symbolAnchor).toBe("log");
    expect(eventAnchor).toBe("RUN_REQUEST");

    expect(
      registry.getAnchor("api", "openapi.operation.submitWorkBySessionId"),
    ).toBe("submitWorkBySessionId");
    expect(registry.get("cli", "cli.you.config.init")).toEqual({
      owningPageId: "cli",
      itemId: "cli.you.config.init",
      kind: "command",
      identity: "you config init",
      anchor: "you-config-init",
    });
  });

  test("groups registrations by owning page for later collision checks", () => {
    const registry = createReferenceAnchorRegistry();

    registry.register({
      owningPageId: "api",
      itemId: "op.a",
      kind: "operation",
      identity: "alpha",
    });
    registry.register({
      owningPageId: "api",
      itemId: "op.b",
      kind: "operation",
      identity: "beta",
    });
    registry.register({
      owningPageId: "events",
      itemId: "ev.a",
      kind: "event",
      identity: "ALPHA",
    });

    expect(registry.listOwningPages()).toEqual(["api", "events"]);
    expect(registry.listPage("api").map((entry) => entry.itemId)).toEqual([
      "op.a",
      "op.b",
    ]);
    expect(registry.listPage("events")).toHaveLength(1);
    expect(registry.listPage("missing")).toEqual([]);

    // Same fragment text on different pages stays independently addressable.
    expect(registry.getAnchor("api", "op.a")).toBe("alpha");
    expect(registry.getAnchor("events", "ev.a")).toBe("ALPHA");
  });

  test("idempotent identical re-registration returns the same anchor", () => {
    const registry = createReferenceAnchorRegistry();
    const input = {
      owningPageId: "api",
      itemId: "op.submit",
      kind: "operation" as const,
      identity: "submitWorkBySessionId",
    };

    const first = registry.register(input);
    const second = registry.register(input);
    expect(first).toBe(second);
    expect(registry.listPage("api")).toHaveLength(1);
  });

  test("fails closed when two distinct items on the same page share an anchor", () => {
    const registry = createReferenceAnchorRegistry();

    registry.register({
      owningPageId: "api",
      itemId: "op.submit",
      kind: "operation",
      identity: "submitWorkBySessionId",
    });

    // Distinct identity that slugifies to the same fragment.
    expect(() =>
      registry.register({
        owningPageId: "api",
        itemId: "op.submit-alias",
        kind: "operation",
        identity: "submitWorkBySessionId!!!",
      }),
    ).toThrow(ReferenceAnchorRegistryError);

    try {
      registry.register({
        owningPageId: "api",
        itemId: "op.submit-alias",
        kind: "operation",
        identity: "submitWorkBySessionId!!!",
      });
      throw new Error("expected anchor-collision");
    } catch (error) {
      expect(error).toBeInstanceOf(ReferenceAnchorRegistryError);
      const collision = error as ReferenceAnchorRegistryError;
      expect(collision.code).toBe("anchor-collision");
      expect(collision.owningPageId).toBe("api");
      expect(collision.anchor).toBe("submitWorkBySessionId");
      expect(collision.itemId).toBe("op.submit-alias");
      expect(collision.collidingItemId).toBe("op.submit");
      expect(collision.message).toContain("submitWorkBySessionId");
      expect(collision.message).toContain("op.submit");
      expect(collision.message).toContain("op.submit-alias");
      expect(collision.message).toContain("api");
    }

    // First registration remains the sole owner of the fragment.
    expect(registry.listPage("api")).toHaveLength(1);
    expect(registry.getAnchor("api", "op.submit")).toBe(
      "submitWorkBySessionId",
    );
  });

  test("same anchor string on different owning pages does not collide", () => {
    const registry = createReferenceAnchorRegistry();

    const apiAnchor = registry.register({
      owningPageId: "api",
      itemId: "op.alpha",
      kind: "operation",
      identity: "alpha",
    });
    const eventsAnchor = registry.register({
      owningPageId: "events",
      itemId: "ev.alpha",
      kind: "event",
      identity: "alpha",
    });

    expect(apiAnchor).toBe("alpha");
    expect(eventsAnchor).toBe("alpha");
    expect(registry.getAnchor("api", "op.alpha")).toBe("alpha");
    expect(registry.getAnchor("events", "ev.alpha")).toBe("alpha");
    expect(registry.listPage("api")).toHaveLength(1);
    expect(registry.listPage("events")).toHaveLength(1);
  });

  test("fails closed when the same itemId is re-registered with a different payload", () => {
    const registry = createReferenceAnchorRegistry();

    registry.register({
      owningPageId: "cli",
      itemId: "cli.you.config.init",
      kind: "command",
      identity: "you config init",
    });

    expect(() =>
      registry.register({
        owningPageId: "cli",
        itemId: "cli.you.config.init",
        kind: "command",
        identity: "you config show",
      }),
    ).toThrow(ReferenceAnchorRegistryError);

    try {
      registry.register({
        owningPageId: "cli",
        itemId: "cli.you.config.init",
        kind: "command",
        identity: "you config show",
      });
      throw new Error("expected anchor-collision");
    } catch (error) {
      expect(error).toBeInstanceOf(ReferenceAnchorRegistryError);
      const collision = error as ReferenceAnchorRegistryError;
      expect(collision.code).toBe("anchor-collision");
      expect(collision.owningPageId).toBe("cli");
      expect(collision.itemId).toBe("cli.you.config.init");
      expect(collision.message).toContain("you-config-init");
      expect(collision.message).toContain("you-config-show");
    }

    expect(registry.getAnchor("cli", "cli.you.config.init")).toBe(
      "you-config-init",
    );
  });

  test("toJSON snapshots page-grouped plain objects", () => {
    const registry = createReferenceAnchorRegistry();
    registry.register({
      owningPageId: "mcp",
      itemId: "tool.get",
      kind: "tool",
      identity: "you.factory_session.get",
    });

    expect(registry.toJSON()).toEqual({
      pages: {
        mcp: [
          {
            owningPageId: "mcp",
            itemId: "tool.get",
            kind: "tool",
            identity: "you.factory_session.get",
            anchor: "you.factory_session.get",
          },
        ],
      },
    });
  });

  test("rejects malformed registration inputs", () => {
    const registry = createReferenceAnchorRegistry();

    expect(() =>
      registry.register({
        owningPageId: "",
        itemId: "op.a",
        kind: "operation",
        identity: "alpha",
      }),
    ).toThrow(ReferenceAnchorRegistryError);

    expect(() =>
      registry.register({
        owningPageId: "api",
        itemId: "op.a",
        kind: "operation",
        identity: "",
      }),
    ).toThrow(ReferenceAnchorRegistryError);

    expect(() =>
      registry.register({
        owningPageId: "api",
        itemId: "op.a",
        // @ts-expect-error intentional invalid kind
        kind: "overlay",
        identity: "alpha",
      }),
    ).toThrow(ReferenceAnchorRegistryError);
  });
});
