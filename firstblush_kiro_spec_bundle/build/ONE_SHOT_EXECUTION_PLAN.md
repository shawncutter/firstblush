# FirstBlush One-Shot Execution Plan
Date: 2026-02-07
Goal: turn concept into a shippable v1 beta path with minimal ambiguity.

## What is now in repo
- Local infra scaffold: `/Users/shawncutter/git/P2L/FirstBlush/docker-compose.yml`
- API starter: `/Users/shawncutter/git/P2L/FirstBlush/services/api`
- DB schema draft: `/Users/shawncutter/git/P2L/FirstBlush/services/api/db/schema.sql`
- Spec review and v1 locks:
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/build/SPEC_REVIEW.md`
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/build/V1_LOCKED_DECISIONS.md`

## Build sequence (next 6 weeks)

### Week 1-2: Vertical slice
- Integrate real Postgres access in API.
- Integrate MinIO upload flow (presigned upload + persisted video URL).
- Implement end-to-end flow:
  - social sign-in
  - create group
  - request join and approve
  - create post
  - react to post
  - fetch reaction chain

### Week 3-4: Trust and privacy baseline
- Add block/mute endpoints and enforcement in feed visibility.
- Add per-post visibility checks for group-only content.
- Add request logging and basic analytics event capture.

### Week 5-6: iOS first client slice
- Build iOS React Native app shell with:
  - auth session storage
  - feed screen
  - post composer
  - reaction composer + stacked chain viewer
- Ship internal TestFlight build for first user loop test.

## API contracts to keep stable now
- `POST /v1/auth/apple`
- `POST /v1/auth/google`
- `GET /v1/groups`
- `POST /v1/groups`
- `POST /v1/groups/:id/request-join`
- `POST /v1/groups/:id/approve/:userId`
- `POST /v1/posts`
- `GET /v1/posts/:id`
- `POST /v1/posts/:id/reactions`
- `GET /v1/posts/:id/reaction-chain`
- `GET /v1/feed`
- `POST /v1/reports`

## Definition of done for MVP alpha
- A new user can sign in and complete the full content-to-reaction chain loop.
- Group access control is enforced.
- Feed is chronological and stable.
- Reporting works.
- Docker stack runs locally on M2 without resource spikes.
