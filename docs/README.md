# FirstBlush Documentation Map

This `docs/` folder is the active source of project truth for execution.

## Source-of-truth order

When docs conflict, resolve in this order:

1. `docs/SCOPE_AND_DECISIONS.md`
2. `docs/BACKLOG.md`
3. `docs/AI_ENGINEERING_OPERATING_MODEL.md`
4. Service docs (`apps/web/README.md`, `services/api/README.md`)
5. Historical spec bundle (`firstblush_kiro_spec_bundle/`)

## What each file is for

- `SCOPE_AND_DECISIONS.md`: locked scope, architecture direction, and explicit non-goals.
- `BACKLOG.md`: prioritized work queue with dependencies and acceptance criteria.
- `AI_ENGINEERING_OPERATING_MODEL.md`: how AI agents and humans collaborate for high throughput.

## Change policy

- Update `SCOPE_AND_DECISIONS.md` first when product or architecture decisions change.
- Update `BACKLOG.md` whenever priorities, statuses, or dependencies change.
- Keep service READMEs implementation-specific; avoid adding cross-project strategy there.
- Treat `firstblush_kiro_spec_bundle/` as reference context, not operational truth.
