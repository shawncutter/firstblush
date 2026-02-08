# FirstBlush Web-First MVP One-Shot Execution Plan
Date: 2026-02-07
Status: Execution-ready

## 1) Decision update (supersedes earlier sequencing)
This plan prioritizes **web first** for MVP delivery.
- Primary platform for MVP: Web app (desktop + mobile web responsive).
- Native iOS/Android clients move to post-MVP phase.
- Auth for MVP: Apple + Google sign-in.
- Feed strategy for MVP: chronological.
- Group strategy for MVP: invite/approval lock-in.
- Moderation: near-MVP baseline with manual workflow + optional AI assist behind feature flags.

## 2) MVP cutline (must be working)
Ship only when all are working in production-like environment:
- Account: Apple/Google sign-in, session management, logout.
- Profile: create/edit profile (name, bio, avatar, interests).
- Seed content: upload video and publish post.
- Reaction mechanic: record/upload reaction video, link to post or reaction.
- Reaction chains: ordered stacked-carousel data API and web UI.
- Feed: chronological feed with privacy enforcement.
- Community: create group, request join, approve join, post within groups.
- Safety: report content, block user, mute user, moderation queue.
- Notifications: in-app notifications for reactions, approvals, reports updates.
- Basic analytics: view count + reaction count + share count.
- Website: Home, About, Features, How It Works, Community, Blog, FAQs, Privacy, Terms, Contact + early access capture.

## 3) One-shot target architecture
Monorepo, web-first, minimal moving parts:
- `apps/web`: Next.js app (App Router) for product + marketing pages.
- `services/api`: Node/Express API (existing starter; upgraded to real persistence).
- `Postgres`: system of record.
- `Redis`: cache + rate limiting + job queue broker.
- `MinIO` (local) / S3 (cloud): video/object storage.
- `Worker` (Node): moderation + async media tasks.
- `docker-compose`: one-command local boot.

## 4) Data model for MVP (required tables)
Required and enforced with migrations:
- `users`, `sessions`, `profiles`
- `groups`, `group_members`, `group_join_requests`
- `media_assets`, `posts`, `reactions`
- `follows`, `likes`, `comments`, `shares`
- `notifications`
- `user_safety_edges` (block/mute), `reports`, `moderation_actions`
- `analytics_events`, `post_daily_metrics`

## 5) API contracts to stabilize early
### Auth/Profile
- `POST /v1/auth/apple`
- `POST /v1/auth/google`
- `POST /v1/auth/logout`
- `GET /v1/me`
- `PATCH /v1/me/profile`
- `PATCH /v1/me/privacy`

### Groups
- `GET /v1/groups`
- `POST /v1/groups`
- `POST /v1/groups/:id/request-join`
- `POST /v1/groups/:id/approve/:userId`
- `GET /v1/groups/:id`

### Content + Reactions
- `POST /v1/media/uploads/init`
- `POST /v1/media/uploads/complete`
- `POST /v1/posts`
- `GET /v1/posts/:id`
- `GET /v1/feed`
- `POST /v1/posts/:id/reactions`
- `GET /v1/posts/:id/reaction-chain`

### Engagement
- `POST /v1/posts/:id/like`
- `POST /v1/posts/:id/comments`
- `POST /v1/users/:id/follow`
- `POST /v1/posts/:id/share`

### Safety + Moderation
- `POST /v1/reports`
- `POST /v1/safety/block/:userId`
- `POST /v1/safety/mute/:userId`
- `GET /v1/moderation/queue` (admin)
- `POST /v1/moderation/actions` (admin)

### Notifications + Analytics
- `GET /v1/notifications`
- `POST /v1/notifications/:id/read`
- `GET /v1/creator/metrics`

## 6) Web app routes/screens (must exist)
### Product app
- `/login`
- `/onboarding`
- `/feed`
- `/post/new`
- `/post/[id]`
- `/reaction/new?postId=...`
- `/groups`
- `/groups/[id]`
- `/notifications`
- `/settings/privacy`
- `/creator/analytics`

### Marketing site
- `/`
- `/about`
- `/features`
- `/how-it-works`
- `/community`
- `/blog`
- `/faqs`
- `/privacy`
- `/terms`
- `/contact`
- `/early-access`

## 7) AI moderation near-MVP implementation
Use hybrid moderation for practical launch:
- Default: rules-based checks (text + metadata) + report queue.
- Optional AI provider adapter (flagged):
  - `AI_MODERATION_ENABLED=true|false`
  - `AI_MODERATION_PROVIDER=openai|mock`
- Kill switch required in all environments.
- If AI fails/timeouts: fallback to manual queue, never block core posting path silently.

## 8) One-shot execution sequence (ordered work packages)
Execute in order without skipping gates.

### WP-1 Foundation hardening
- Add root README quickstart and architecture overview.
- Add migration framework and create baseline schema.
- Replace in-memory store with Postgres repositories.
Gate:
- API boots; health check passes; schema migrates from clean DB.

### WP-2 Auth + session correctness
- Implement real Apple/Google token validation.
- Add secure sessions/JWT, refresh, logout.
Gate:
- Invalid provider tokens rejected; valid sign-in works end-to-end.

### WP-3 Media ingestion
- Implement upload init/complete with MinIO/S3 presigned URLs.
- Persist media metadata and ownership.
Gate:
- Browser can upload video and receive playable URL.

### WP-4 Core social loop
- Post create/read, feed, reaction create/read, reaction chains.
- Chain ordering and parent-child integrity checks.
Gate:
- New user can post seed + create reaction + view chain.

### WP-5 Groups + privacy
- Group create/request/approve flows.
- Enforce privacy and membership constraints in feed/detail APIs.
Gate:
- Unauthorized users cannot access restricted group content.

### WP-6 Safety + moderation
- Report/block/mute endpoints and enforcement.
- Moderation queue + admin action endpoints.
- AI moderation adapter + kill switch.
Gate:
- Blocking removes target content from feed; reports land in queue.

### WP-7 Engagement + notifications + analytics
- Like/comment/follow/share endpoints.
- Notification fanout and read state.
- Basic creator metrics rollups.
Gate:
- Creator can view non-empty metrics dashboard.

### WP-8 Web product UI
- Build all product routes and wire to APIs.
- Add loading/error/empty states on all critical views.
Gate:
- Complete user journey works in browser with no manual DB edits.

### WP-9 Marketing + early access
- Build required marketing routes and early-access capture form.
Gate:
- All required pages exist and are linked in nav/footer.

### WP-10 Quality + delivery
- Add unit/integration tests for critical API flows.
- Add Playwright e2e for auth→post→reaction chain path.
- Add CI workflow (build, test, lint, smoke compose).
Gate:
- CI passes on clean clone.

## 9) Definition of Done (web MVP)
MVP is done only when all conditions are true:
- Full web journey works: sign-in → onboarding → post → react → chain view → group share.
- Safety tools work: report, block, mute, moderation actions.
- Core engagement works: like, comment, follow, share.
- Notifications and creator metrics are visible and updating.
- Docker local boot works on M2 with stable resource usage.
- Tests and CI are green.

## 10) Local run contract
From repo root:
```bash
docker-compose up -d --build
```
Expected:
- API: `http://localhost:8080/v1/health`
- Web: `http://localhost:3000` (to be added in this plan)

## 11) Scope guardrails (to prevent slip)
- No native mobile client work before web MVP done.
- No advanced AR/effects tooling before MVP done.
- No emotion recognition in MVP path unless explicitly re-approved.
- Monetization is out of MVP cutline.

## 12) Immediate next execution step
Start WP-1 and WP-2 first:
- database integration
- auth hardening
- migration + test harness

These unlock every downstream feature and remove the biggest technical risk.
