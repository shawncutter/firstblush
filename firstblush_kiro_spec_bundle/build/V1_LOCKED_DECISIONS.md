# FirstBlush v1 Locked Decisions
Date: 2026-02-07
Applies to: public beta target (Summer 2026)

This file is the implementation source of truth when any older spec text conflicts.

## Product scope locks
- Platform: iOS only.
- Auth: Apple Sign In + Google Sign In only.
- Core differentiator: reaction chains.
- Reaction chain UX: stacked carousel.
- Feed ranking: chronological only.
- Group access: invite/approval required.
- Default privacy: public by default, with per-post visibility controls.
- Trust and safety v1: block, mute, report only.
- Launch type: public beta.
- Primary KPI: growth.

## Engineering implications
- No email/password auth in v1.
- No Android client in v1.
- No ML-driven ranking/moderation in v1 path to beta.
- No emotion recognition in v1.

## API design implications
- Must support social-auth endpoints and session issuance.
- Must support group join request and owner approval flows.
- Must support reaction chains as first-class retrieval endpoint.
- Must support chronological feed endpoint with optional group filtering.

## Acceptance implications
P0 tests must validate:
- social sign-in success path
- group invite/approval join flow
- reaction chain creation and ordered retrieval
- chronological feed behavior
- block/mute/report baseline (report endpoint in first slice; block/mute by sprint 2)
