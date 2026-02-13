# FirstBlush API Starter

This is a one-shot starter service aligned to the v1 product decisions:
- web-first MVP demo
- Apple/Google sign-in
- reaction-chain first UX
- chronological feed
- invite/approval groups

Project scope and backlog are managed in:
- `../../docs/SCOPE_AND_DECISIONS.md`
- `../../docs/BACKLOG.md`

## Run locally

From repo root:

```bash
./scripts/dev-up.sh
```

API base URL:
- `http://localhost:28110/v1`

Health check:

```bash
curl http://localhost:28110/v1/health
```

## Current status

Implemented:
- Social auth stubs for Apple/Google (`POST /v1/auth/apple`, `POST /v1/auth/google`)
- Session logout (`POST /v1/auth/logout`)
- User profile and privacy (`GET /v1/me`, `PATCH /v1/me/profile`, `PATCH /v1/me/privacy`)
- Group creation, join-request, and owner approval
- Post creation and feed read (chronological)
- Reaction creation and chain retrieval (`GET /v1/posts/:id/reaction-chain`)
- Likes and comments (`POST /v1/posts/:id/like`, `POST /v1/posts/:id/comments`)
- Social follow (`POST /v1/users/:id/follow`)
- Safety actions (`POST /v1/safety/block/:userId`, `POST /v1/safety/mute/:userId`)
- Notifications + creator metrics (`GET /v1/notifications`, `GET /v1/creator/metrics`)
- Report creation (`POST /v1/reports`)

Not implemented yet:
- Real provider token verification
- Persistent DB integration
- MinIO upload flows
- Advanced moderation queue actions
- Full AI moderation/ranking providers
