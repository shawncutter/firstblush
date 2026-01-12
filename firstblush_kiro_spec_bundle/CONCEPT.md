# FirstBlush Concept Overview
Status: Draft (derived from PRD.md and TECH_SPEC.md)

## 1) One-liner
Experience moments as they happen with FirstBlush, a mobile-first social video platform for real-time reactions and authentic connection.

## 2) What it is
FirstBlush is a social video app centered on capturing and sharing immediate reactions to content. It blends short-form video with community groups, lightweight personalization, and privacy-first controls to make interaction feel more real and less curated.

## 3) Why it exists
Users are increasingly frustrated with overly polished feeds and opaque privacy practices. FirstBlush targets the desire for authenticity, real-time engagement, and clear control over who can see what.

## 4) Core experience loop (MVP)
- Sign up and create a profile with interests.
- Join community groups around shared topics.
- Watch short videos in a feed.
- Record and share instant reactions to posts.
- Receive reactions and follow reaction chains.

## 5) Differentiators
- Real-time reaction capture as a first-class interaction, not just likes.
- Reaction chains that show sequences of responses.
- Community groups that steer discovery and engagement.
- Privacy controls that let users set visibility per post and profile.
- AI foundations (personalization, moderation) with opt-in expansion later.

## 6) MVP scope
In:
- Account creation and profile setup.
- Video upload, posting, and playback.
- Real-time reactions linked to original posts.
- Groups with join and group-based posting.
- Basic personalization (heuristics) and notifications (optional).
- Baseline trust and safety (reporting, basic moderation).

Out (initially):
- Full monetization systems (ads, subscriptions, purchases).
- Advanced emotion recognition surfaced to users.
- Heavy AR lenses and advanced editing tools.

## 7) Privacy and trust stance
- User-controlled visibility for content and profile.
- Reporting and moderation flows available from MVP.
- Compliance requirements (GDPR/CCPA/COPPA) tracked before public launch.

## 8) Technology posture (MVP)
- Mobile-first app (React Native) with a Node.js API.
- Postgres for core data, Redis for caching.
- Media storage via MinIO locally, S3/GCS later.
- Docker-based local dev stack sized for an M2 MacBook.
- AI features feature-flagged until policies and UX are finalized.

## 9) Open questions to resolve
- Final auth model: password vs OTP vs social login.
- Reaction chain UX rules (depth, ordering, limits).
- Group creation/moderation rules and limits.
- Emotion recognition policy and consent flow.
- Age gating and COPPA enforcement approach.
