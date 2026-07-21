# PS-400 Lane F — live verify evidence (page-structure)

Verification-first notes for tip GitHub Pages after PS-300 membership finish
([#240](https://github.com/portpowered/you-agent-factory-docs/pull/240)). Locked
IA control: `docs/temp/page-structure/ia.md` (local planner state). Product code
changes only when a concrete live defect blocks acceptance.

**Live base:** https://portpowered.github.io/you-agent-factory-docs/  
**Tip deploy:** [Deploy GitHub Pages run 29831119261](https://github.com/portpowered/you-agent-factory-docs/actions/runs/29831119261)
(`4515f350`, conclusion `success` at `2026-07-21T12:52:00Z`)  
**#240 merged:** `2026-07-21T12:40:59Z`

## Outcome (1) — Top-level explorer order

| Field | Value |
| --- | --- |
| Story | `ia-live-verify-page-structure-001` |
| Visited (UTC) | `2026-07-21T12:52:45Z` |
| Route | `/docs/guides/getting-started/` (`200`) |
| Also checked | `/` (`200`); `/docs/` returns `404` (no index export — not an explorer defect) |
| Method | Fetch static HTML; read `#nd-sidebar` folder `button[aria-expanded]` labels in DOM order, plus top-level FAQ page link |

**Expected (locked IA / tip contract):** Guides → Program documentation →
Concepts → Techniques → Reference → Internal architecture → Miscellanea → FAQ

**Observed top-level folders (sidebar button order):**

1. Guides
2. Program documentation
3. Concepts
4. Techniques
5. Reference
6. Internal architecture
7. Miscellanea

**Observed top-level page:** FAQ → `/you-agent-factory-docs/docs/documentation/faq/`
(last top-level explorer entry; not nested under Program documentation)

**Result:** PASS — matches locked order. No product code or expect-fix required.

## Outcome (2) — Program subgroups and Mode A discoverability

| Field | Value |
| --- | --- |
| Story | `ia-live-verify-page-structure-002` |
| Visited (UTC) | `2026-07-21T12:56:16Z` |
| Primary route | `/docs/documentation/factory-session/` (`200`, Program folder expanded) |
| Also visited | `/docs/documentation/dynamic-workflows/`, `/docs/documentation/packaged-factories/`, `/docs/documentation/cli/`, `/docs/documentation/mcp/`, `/docs/documentation/api/` (all `200`) |
| Method | Fetch static HTML on a Program child route; read Program separator `<p>` labels (uppercase group headers) and child page links under `#nd-sidebar` |

**Expected (locked IA / tip contract):** Program subgroups Orientation →
Capabilities → Interfaces → Operations; Mode A overviews under Capabilities;
CLI / MCP / API how-to under Interfaces.

**Observed Program separators (DOM order under Program documentation):**

1. Orientation
2. Capabilities
3. Interfaces
4. Operations

**Capabilities — Mode A overviews discoverable:**

| Label | Route | HTTP |
| --- | --- | --- |
| Dynamic Workflows | `/docs/documentation/dynamic-workflows/` | `200` |
| Factory Sessions | `/docs/documentation/factory-session/` | `200` |
| Packaged Factories | `/docs/documentation/packaged-factories/` | `200` |

**Interfaces — how-tos discoverable:**

| Label | Route | HTTP |
| --- | --- | --- |
| API | `/docs/documentation/api/` | `200` |
| CLI | `/docs/documentation/cli/` | `200` |
| MCP | `/docs/documentation/mcp/` | `200` |

**Operations:** Present as separator; includes nested “Configuring
you-agent-factory” folder plus Dashboard / Logs / Metrics pages (spot-checked
via expanded Program tree on the factory-session route).

**Result:** PASS — locked subgroups present; Mode A Capabilities overviews and
Interfaces API/CLI/MCP how-tos discoverable and open published Program routes.
No product code or expect-fix required.

## Outcome (3) — Reference nesting

| Field | Value |
| --- | --- |
| Story | `ia-live-verify-page-structure-003` |
| Visited (UTC) | `2026-07-21T12:58:36Z` (tip Pages baseline); local contract re-check after fix |
| Primary route | `/docs/references/api/` (`200`, Reference expanded) |
| Also visited | `/docs/references/cli/`, `/docs/references/events/`, `/docs/references/javascript-runtime/`, `/docs/references/mcp-reference/`, `/docs/references/factory-schema/`, `/docs/references/mock-workers-schema/`, `/docs/references/system-config-schema/`, `/docs/documentation/throttling-and-limits/`, `/docs/factories/sessions/`, `/docs/workers/`, `/docs/workstations/` (all `200`) |
| Method | Fetch static HTML on Reference child routes; parse `#nd-sidebar` separators, page links, and nested folders under expanded Reference; confirm Factories / Workers / Workstations are not top-level peers |

**Expected (locked IA / tip contract):** Under Reference — Contracts (API, CLI,
Events, MCP catalog, JavaScript Runtime as published), Schemas, Limits
(throttling), then nested Factories / Workers / Workstations. Those three
families must not appear as top-level explorer peers.

**Observed on tip Pages (`4515f350`) before fix:**

| Group / nest | Observed |
| --- | --- |
| Contracts | API, CLI, Events, JavaScript Runtime |
| Schemas | Factory schema, Mock-workers schema, System configuration schema |
| Limits | Throttling and limits |
| Ungrouped under Reference (after Limits) | **MCP Reference** (`/docs/references/mcp-reference/`) — mis-placed |
| Nested folders | Factories, Workers, Workstations (not top-level) |
| Factories children (on `/docs/factories/sessions/`) | Dynamic Workflows, Factory Sessions, Packaged Factories |

**Concrete live defect:** `FACTORY_REFERENCE_SIDEBAR_GROUP_BY_SLUG` keyed Mode B
MCP as `mcp` (Program how-to slug) instead of published `mcp-reference`, so the
catalog trailed Limits as an ungrouped Reference leftover instead of sitting
under Contracts.

**Fix (smallest product change):** map `"mcp-reference": "contracts"` and lock
placement in `explorer-ia-contract.test.ts`. Local contract tree now places
`/docs/references/mcp-reference` under Contracts and not under Limits.

**Result:** PASS after fix — nesting matches locked IA; tip Pages will show the
MCP Contracts placement after this branch deploys. No PS-H1 / schema / chrome
work.

## Outcome (4) — Dual-link Mode A ↔ Mode B

| Field | Value |
| --- | --- |
| Story | `ia-live-verify-page-structure-004` |
| Visited (UTC) | `2026-07-21T13:08:00Z` (tip Pages baseline); local page-render re-check after fix |
| Mode A routes | `/docs/documentation/factory-session/`, `/docs/documentation/dynamic-workflows/`, `/docs/documentation/packaged-factories/`, `/docs/documentation/api/` (all `200`) |
| Mode B routes | `/docs/factories/sessions/`, `/docs/factories/dynamic-workflows/`, `/docs/factories/packaged/`, `/docs/references/api/` (all `200`) |
| Method | Fetch tip Pages article HTML; list `<a href>` in `<article>`; confirm OpenAPI embed markers absent on API how-to |

**Expected:** At least one Capability overview links to its matching Reference
depth route; Interfaces API how-to links to `/docs/references/api` without
embedding OpenAPI on the how-to. Optional reciprocal overview links from depth
pages are not blocking unless a merged content PR required them.

**Observed on tip Pages (`4515f350`) before fix:**

| Check | Result |
| --- | --- |
| Factory Sessions overview → `/docs/factories/sessions` | FAIL — prose names “Factory Sessions reference” but no article `<a href>` |
| Dynamic Workflows overview → `/docs/factories/dynamic-workflows` | FAIL — same prose-only pattern |
| Packaged Factories overview → `/docs/factories/packaged` | FAIL — same prose-only pattern |
| API how-to → `/docs/references/api` | PASS — `Reference API (operations catalog)` link present |
| API how-to OpenAPI embed | PASS — no swagger-ui / redoc / openapi.json embed; catalog projection stays on `/docs/references/api` |
| Optional reciprocal depth → overview | Not present on tip Pages; not treated as blocking |

**Concrete live defect:** Mode A Capability overviews pointed readers at Mode B
in prose only. Dual-link acceptance requires a reader-visible href (same
contract as API how-to → Contracts catalog).

**Fix (smallest product change):** add page-local `<LocalizedLinkList>` under
Limits And Assumptions on each Mode A overview to the matching
`/docs/factories/{sessions,dynamic-workflows,packaged}` depth route; assert
`a[href=…]` in the three page-local tests.

**Result:** PASS after fix — Capability dual links + API catalog dual link
proven locally; tip Pages will show Capability hrefs after this branch deploys.
No OpenAPI embed on the how-to. No PS-H1 / schema / chrome work.

## Outcome (5) — Getting Started owns install; install absent from explorer

| Field | Value |
| --- | --- |
| Story | `ia-live-verify-page-structure-005` |
| Visited (UTC) | `2026-07-21T13:04:40Z` |
| Tip Pages baseline | Post-#240 tip still live after later main deploys; last successful Deploy GitHub Pages before visit: [run 29832455302](https://github.com/portpowered/you-agent-factory-docs/actions/runs/29832455302) (`11930d69`, #242). Prerequisite #240 remaining on tip ancestry. |
| Routes | `/docs/guides/getting-started/` (`200`); `/docs/documentation/install/` (`200` stub); `/docs/documentation/factory-session/` (`200`, Program expanded for explorer scan) |
| Method | Fetch tip Pages HTML; confirm Getting Started `#install` teaching ownership; scan `#nd-sidebar` hrefs/labels for `documentation/install` absence; confirm install URL remains a thin compatibility stub |

**Expected:** Guides → Getting Started presents install teaching (OS release
scripts / platform steps). `documentation/install` is not a sidebar/explorer
destination under Program or any other top-level folder. A direct visit to the
published install URL may stub/redirect but must not re-promote Install into
the explorer.

**Observed:**

| Check | Result |
| --- | --- |
| Getting Started `#install` section | PASS — heading `Install`; `install.sh` and `install.ps1` release commands present; `you init` teaching present |
| Guides explorer children | PASS — Getting Started / Cursor Dynamic Workflows / Using you-agent-factory for loops / Write-review loops only; no Install destination |
| `#nd-sidebar` on Getting Started | PASS — no `documentation/install` href; no `Install` page label |
| `#nd-sidebar` on Program-expanded route | PASS — no `documentation/install` href; no `Install` page label under Program or elsewhere |
| Direct `/docs/documentation/install/` | PASS — `200` thin stub (“Install path”) linking to Getting Started; no `install.sh` / `install.ps1` teaching on the stub |

**Result:** PASS — Getting Started owns install teaching; Install is demoted from
the explorer while the compatibility stub remains reachable by URL. Notes-only;
no product code or expect-fix required.

## Outcome (6) — Visit evidence published; only concrete defects filed

| Field | Value |
| --- | --- |
| Story | `ia-live-verify-page-structure-006` |
| Closed (UTC) | `2026-07-21T13:07:05Z` |
| Evidence surface | This note + PR description / conversation for branch `ia-live-verify-page-structure` |
| Method | Consolidate outcomes (1)–(5); classify in-lane fixes vs non-blocking notes; confirm fence |

### Outcomes (1)–(5) rollup against locked IA

| # | Outcome | Result | Product / expect change? |
| --- | --- | --- | --- |
| 1 | Top-level explorer order | PASS (live tip Pages) | Notes-only |
| 2 | Program subgroups + Mode A discoverability | PASS (live tip Pages) | Notes-only |
| 3 | Reference nesting | PASS after in-lane fix | Yes — `mcp-reference` Contracts membership + explorer-ia-contract |
| 4 | Dual-link Mode A ↔ Mode B | PASS after in-lane fix | Yes — Capability overview `<LocalizedLinkList>` + page-local href tests |
| 5 | Getting Started owns install; install absent from explorer | PASS (live tip Pages) | Notes-only |

### Concrete defects handled in-lane (not deferred)

1. **MCP Mode B catalog ungrouped after Limits** — membership keyed `mcp` instead of published `mcp-reference`. Fixed in story `003`; tip Pages will show Contracts placement after this branch deploys.
2. **Capability overviews lacked Mode B hrefs** — prose-only “X reference”. Fixed in story `004`; tip Pages will show Capability dual links after this branch deploys.

### Explicitly not filed as follow-up slices

- Optional reciprocal overview links from `/docs/factories/*` depth pages were absent on tip Pages and are **not** treated as blocking for PS-400 (acceptance allows missing optional reciprocal unless a merged content PR required them). Filing that as polish would be silent scope creep.
- No PS-H1…H5, schema invention, page-formatting / homepage-2 / graph-pages / SEO ownership, or sidebar active CSS retints started or queued from this lane.

### Verification-first posture

Lane shipped notes-first. Product/expect edits landed only when live evidence blocked acceptance criteria (outcomes 3 and 4). Quality gate for those surfaces: typecheck / lint / touched tests pass on this branch before merge.

## Fence

No PS-H1…H5, schema invention, page-formatting / homepage-2 / graph-pages / SEO
ownership, or sidebar active CSS retints in this lane.
