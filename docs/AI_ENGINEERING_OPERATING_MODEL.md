# FirstBlush AI Engineering Operating Model

Last updated: 2026-02-13
Goal: maximize throughput while protecting quality and scope discipline.

## Team topology (human + AI agents)

| Agent | Mission | Owns | Primary outputs |
|---|---|---|---|
| Orchestrator Agent | Keep execution aligned to locked scope and unblock dependencies | Backlog ordering, dependency graph, WIP policy | Weekly plan, daily priorities, risk log |
| Platform/Data Agent | Build reliable persistence and runtime foundation | Migrations, repositories, Redis contracts, data integrity | Schema changes, repository code, migration docs |
| API Product Agent | Deliver business endpoints and policy enforcement | Auth/session, groups, content/reaction, safety/moderation APIs | Endpoint implementations + contract tests |
| Web Product Agent | Deliver end-user product and marketing flows | Product routes, UX states, marketing pages, API wiring | Web UI code + route-level acceptance checks |
| QA/Release Agent | Prevent regressions and enforce release gates | Integration tests, e2e tests, CI pipelines | Stable test suites, green CI gates |
| Docs/Knowledge Agent | Keep docs actionable and current | Scope docs, backlog docs, runbooks | Updated documentation tied to shipped behavior |

## Work lanes and WIP limits

- Lane A: Platform/Data (`max in_progress: 2`)
- Lane B: Product/API+Web (`max in_progress: 3`)
- Lane C: QA/Release (`max in_progress: 2`)

No agent starts new work if lane WIP limit is hit.

## Intake and handoff contract

Every work item must include:

1. Objective: one outcome sentence.
2. Scope boundary: in-scope and out-of-scope lines.
3. Interfaces touched: endpoints/routes/schema/contracts.
4. Acceptance criteria: testable and binary.
5. Dependency list: explicit predecessor IDs.

Every handoff must include:

1. What changed (files + behavior).
2. Evidence (tests run, screenshots, API samples).
3. Risks or follow-up items.

## Operating cadence

- Daily (15 minutes):
  - Re-rank ready `P0` work.
  - Clear blockers.
  - Re-balance lane load.
- Twice weekly:
  - Backlog grooming with dependency cleanup.
  - Validate docs still match shipped behavior.
- Weekly:
  - Throughput review and defect review.
  - Lock next week's top 5 deliverables.

## Quality gates (required before merge)

- Build passes for changed services.
- Tests relevant to changed behavior pass.
- Documentation updated if behavior or scope changed.
- No unresolved `P0` regression introduced.

## Throughput KPIs

- Completed `P0` items per week.
- Median cycle time (ready -> done).
- Blocked time percentage per item.
- Escaped defect count per week.
- Flow efficiency by lane (`active time / total cycle time`).

## Escalation rules

- If one item is `blocked` > 24 hours, Orchestrator Agent must replan or split scope.
- If a `P0` item misses two planned cycles, reduce scope and ship smaller vertical slice.
- If docs diverge from shipped behavior, Docs/Knowledge Agent updates docs in the same cycle.
