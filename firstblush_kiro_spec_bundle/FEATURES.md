# FirstBlush Feature Plan (Solo Build to Summer 2026)
Status: Draft
Owner: Shawn Cutter

## 0) Assumptions
- Solo developer for the full run-up to launch.
- 40 hours/week average for the next 6 months; adjust if pace changes.
- Summer 2026 public beta target; phases are relative to start date.

## 1) Competitive wedge vs TikTok
FirstBlush wins by being the best place for real-time, authentic reactions, not the slickest feed.
- Reaction-first experience: capture reactions in one tap, immediately connected to the original post.
- Reaction chains: stacked carousel that makes chains easy to browse.
- Community-first discovery: groups steer the feed and create smaller, real connections.
- Privacy clarity: visibility controls are simple, obvious, and trusted.

## 2) Launch success criteria (take-on-TikTok goals)
- North-star metric: reaction chains per DAU (not just views).
- Fast reaction loop: record-to-post in under 15 seconds.
- Reaction adoption: 25%+ of viewers leave a reaction on top content.
- Chain depth: 3+ reactions per top 10% of posts.
- Activation: 50%+ of new users join a group and react within 24 hours.
- Retention: D7 >= 20% for early cohorts; D30 >= 10% by launch.
- Trust: clear privacy options; no public incident from major policy gaps.
- Growth: weekly active users grow consistently through invites and group sharing.

## 3) Roadmap (solo-sized)
Timeframes are relative and assume ~40 hours/week for the next 6 months; adjust if your weekly hours change.

### Phase 0: Foundations (now to ~3-4 months)
Goal: reliable core stack and basic content loop.
- Auth + profile setup (Apple/Google sign-in only).
- Video upload/playback pipeline (local dev on MinIO).
- Basic feed (reverse-chronological only).
- Groups: invite/approval model, join/leave, group feed.
- Privacy controls: public by default, per-post visibility controls.
- Safety baseline: block, mute, report only.
- Docker compose with resource limits for Apple Silicon.

### Phase 1: Core loop (months 5-9)
Goal: ship the core differentiator and make it sticky.
- One-tap reaction capture and playback.
- Reaction chains (stacked carousel).
- Onboarding tuned for joining groups and picking interests.
- Notifications v1 (reactions, replies, group activity).
- Basic search (groups and users).

### Phase 2: Engagement & creator tools (months 10-15)
Goal: increase retention and creator motivation.
- Following/friends graph and personalized home feed.
- Shareable web post pages (for growth outside the app).
- Creator profile upgrades (pinned post, highlights).
- Better reaction creation tools (trim, caption, thumbnail).
- Moderation tooling v1 (report queue, status tracking).

### Phase 3: Launch polish (months 16-18, Summer 2026)
Goal: stability, growth loops, and confidence for public launch.
- Performance tuning for feed + video startup times.
- Improved ranking v2 (behavior signals, session intent).
- Trust & safety hardening (rate limits, abuse flags, block lists).
- Growth loops (invite codes, group share cards, referral tracking).
- Analytics dashboards for core KPIs.

### Post-launch (optional)
- Monetization experiments (subscriptions, brand tools).
- Advanced AI (emotion recognition opt-in, creator assist).

## 4) MVP definition (public beta)
Required to launch a small but real network:
- iOS app only.
- Apple/Google sign-in.
- Post creation, upload, playback.
- Reactions and reaction chains (stacked carousel).
- Groups with invite/approval flow and group posting.
- Public-by-default privacy controls and reporting.
- Basic feed (reverse-chronological) and onboarding.
- Basic analytics and crash reporting.

## 5) Scope guardrails for a solo build
- Do not build full AR lenses or heavy editing.
- Avoid multi-platform web app beyond marketing/share pages.
- Keep AI features behind feature flags until policies and UX are proven.
- Prefer simple, shippable UX over complex social mechanics.

## 6) Decisions locked for v1 (from current answers)
- Differentiator: reaction chains.
- Platform: iOS only.
- Auth: Apple/Google sign-in.
- Reaction chain UX: stacked carousel.
- Groups: invite/approval to join.
- Privacy: public by default.
- Safety: block, mute, report only.
- Feed: reverse-chronological.
- Launch type: public beta (Summer 2026).
- Primary success metric: growth.
