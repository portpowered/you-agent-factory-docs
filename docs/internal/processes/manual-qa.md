# Manual QA for website changes

Use this checklist when reviewing or verifying changes to the You Agent Factory docs website scaffold. Automated `make check` and `make test` are required first; manual QA confirms observable browser behavior on the static export that GitHub Pages will serve.

## Prerequisites

1. From the repository root, run:

```bash
make setup
make check
make test
make build
```

2. Serve the exported `out/` directory with the GitHub Pages base path mounted at the site root. The configured base path is `/you-agent-factory-docs` (see `src/lib/site.ts`).

Pick an unused port in the 3100–3999 range. Example:

```bash
PORT=3457
cd out
python3 -m http.server "$PORT" &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
```

Homepage URL: `http://127.0.0.1:$PORT/you-agent-factory-docs/`  
Docs entry URL: `http://127.0.0.1:$PORT/you-agent-factory-docs/docs/`

## Homepage shell

Verify on desktop and a mobile-width viewport (for example 390px wide):

- [ ] Page loads with HTTP 200 and renders a non-empty landing shell.
- [ ] Project title and value statement are visible.
- [ ] Primary docs CTA is visible, keyboard reachable, and navigates to the docs entry route.
- [ ] GitHub CTA is visible, keyboard reachable, and points to the external repository URL.
- [ ] Semantic landmarks are present (`header`, `main`).

## Docs shell

Verify on desktop and a mobile-width viewport:

- [ ] `/docs/` loads with HTTP 200 and renders a non-empty docs shell.
- [ ] Header, navigation area, and main content region are visible.
- [ ] Framing copy confirms the route is intentional (not an empty placeholder).
- [ ] Home or back navigation returns to the homepage with base-path-aware links.
- [ ] Semantic landmarks are present (`header`, `nav`, `main`).

## Base-path and static export behavior

- [ ] Internal links and asset URLs include the `/you-agent-factory-docs` prefix where expected.
- [ ] Navigation between homepage and docs shell works without server-side fallbacks.
- [ ] No locale-prefixed route trees are introduced; `/docs` remains the canonical docs entry.

## Reporting

Record the port used, URLs checked, viewport sizes, and any failures in the PR conversation. Non-blocking issues (for example a missing `favicon.ico` 404) may be noted but do not block merge unless they break primary navigation or accessibility.
