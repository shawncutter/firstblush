# FirstBlush Scope And Locked Decisions

Last updated: 2026-02-13
Scope: Web MVP delivery path

## Product decisions locked for v1

- Platform for MVP delivery: web-first (responsive desktop/mobile web).
- Auth in MVP: Apple and Google sign-in only.
- Core differentiator: reaction chains.
- Feed strategy: reverse chronological.
- Groups model: request + owner approval.
- Privacy baseline: public by default, with per-post visibility controls.
- Safety baseline: block, mute, report (AI assist optional behind flag).
- Launch type: public beta.

## Architecture decisions locked for v1

- Monorepo with `apps/web` and `services/api`.
- API runtime: Node.js + Express.
- Persistent data target: Postgres.
- Cache/queue target: Redis.
- Media storage target: MinIO locally, S3-compatible in production.
- Local run contract: `docker-compose up -d --build`.

## Explicit non-goals for MVP

- Native iOS/Android app delivery before web MVP is complete.
- Email/password auth in MVP path.
- Advanced feed ranking in MVP path.
- Emotion recognition and advanced ML features in MVP path.
- Monetization systems in MVP path.

## Current implementation reality (as of this update)

- Web and API demo flows exist and cover the social loop in-memory.
- Auth is stubbed and does not validate real provider tokens.
- API persistence is in-memory; migrations and Postgres repositories are pending.
- Media upload init/complete APIs are not implemented yet.
- Moderation queue/admin actions are not implemented yet.
- CI, automated tests, and release gates are not yet in place.

## Doc consistency rule

If any legacy spec file conflicts with this document, this document wins until a new lock decision is approved and recorded here.
