# FirstBlush Execution Backlog

Last updated: 2026-02-13

## Priority model

- `P0`: blocks MVP cutline.
- `P1`: important for MVP quality, not a hard blocker today.
- `P2`: post-MVP or optimization.

## Status model

- `ready`: can start now.
- `in_progress`: actively being built.
- `blocked`: waiting on dependency.
- `done`: merged and verified.

## Throughput rules

- Keep maximum `in_progress` items:
  - Platform/Data lane: 2
  - Product/API lane: 3
  - QA/Release lane: 2
- Do not start a new `P1` while any unblocked `P0` in same lane is `ready`.
- Every `in_progress` item must have an owner and acceptance criteria.

## MVP backlog (ordered)

| ID | Pri | Lane | Task | Status | Depends on | Acceptance criteria |
|---|---|---|---|---|---|---|
| FB-001 | P0 | Platform/Data | Add migration framework and baseline schema in API service | ready | None | Fresh DB migrates cleanly from zero on local compose boot |
| FB-002 | P0 | Platform/Data | Replace in-memory store with Postgres repositories | blocked | FB-001 | Core auth/profile/group/post/reaction flows persist across API restarts |
| FB-003 | P0 | Platform/Data | Add Redis integration for cache and lightweight queue contracts | blocked | FB-002 | Redis is used for at least one production path (rate limit or queue dispatch) |
| FB-004 | P0 | Product/API | Implement real Apple/Google token verification | ready | None | Invalid provider token rejected; valid token creates session |
| FB-005 | P0 | Product/API | Session hardening (expiry, refresh, logout invariants) | blocked | FB-004 | Session behavior covered by integration tests |
| FB-006 | P0 | Product/API | Media upload init/complete APIs with MinIO presigned URLs | ready | FB-001 | Browser uploads video and receives persisted playable URL |
| FB-007 | P0 | Product/API | Enforce privacy/group membership checks across post/feed/reaction endpoints | ready | FB-002 | Unauthorized users cannot access restricted group content |
| FB-008 | P0 | Product/API | Moderation queue read/action endpoints for admin workflow | ready | FB-002 | Reports are listable and state transitions are auditable |
| FB-009 | P0 | Product/API | Safety enforcement in feed and detail views (block/mute/report parity) | ready | FB-002 | Blocked/muted users' content excluded consistently in all reads |
| FB-010 | P0 | Product/API | Notification read-state + creator metrics correctness with persistence | blocked | FB-002 | Metrics/notifications survive restart and match data snapshots |
| FB-011 | P0 | Product/Web | Web routes coverage for MVP (`/login`, `/feed`, `/post/[id]`, `/groups`, `/notifications`, `/settings/privacy`) | ready | FB-004, FB-007 | Full browser journey works without manual DB edits |
| FB-012 | P1 | Product/Web | Marketing routes and early-access capture pages | ready | FB-011 | Required public pages exist and are linked in nav/footer |
| FB-013 | P1 | Product/Web | Product UX hardening (loading/error/empty states on all critical screens) | ready | FB-011 | All critical routes show explicit state handling under API failures |
| FB-014 | P0 | QA/Release | API integration tests for auth->post->reaction chain path | ready | FB-004, FB-006, FB-007 | CI runs and passes in clean environment |
| FB-015 | P0 | QA/Release | Web e2e tests for sign-in->post->react->chain->safety flow | blocked | FB-011, FB-014 | Deterministic green run in CI and local |
| FB-016 | P0 | QA/Release | CI pipeline (build, lint, test, smoke compose) | ready | FB-014 | PR checks run automatically and enforce merge gate |
| FB-017 | P1 | Product/API | AI moderation adapter behind feature flags + kill switch | ready | FB-008 | AI path can be disabled instantly without blocking posting path |
| FB-018 | P1 | Program | KPI instrumentation for reaction-chain activation and retention proxies | blocked | FB-010 | Dashboard-able event data emitted for defined north-star metrics |

## Current baseline already delivered

- Social auth stub endpoints exist (`/v1/auth/apple`, `/v1/auth/google`, `/v1/auth/logout`).
- Group request/approve flow exists.
- Post + reaction chain + likes/comments/follows/reports exist in demo form.
- Safety actions (block/mute/report), notifications, and creator metrics exist in demo form.
- Docker local stack boots web/api/postgres/redis/minio.

## Next 2-week focus recommendation

1. FB-001, FB-004, FB-006, FB-014, FB-016
2. Then FB-002 and FB-007 as the first persistence conversion wave
3. Then FB-011 and FB-015 for full user-journey verification
