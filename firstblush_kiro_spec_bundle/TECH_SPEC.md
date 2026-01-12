# FirstBlush — Kiro-Style Technical Specification
Version: 0.1 (Derived from provided conversation artifacts)
Status: Draft for MVP build

## 1) Technical Goals
- Mobile-first social video app with real-time reaction capture, groups, privacy controls.
  - Trace: “Website → Features”; “Launch Guide → Product Overview”
- Run locally via Docker; support later cloud deployment.
  - Trace: user request local Docker; “Launch Guide → AWS/GCP + CDN”
- Enable AI foundations (personalization, moderation) with feature-flagged integration.
  - Trace: “AI Integration Overview”; “Launch Guide → AI features”

## 2) Chosen Stack (from artifacts + user preference)
### 2.1 Mobile frontend
- React Native (TypeScript)
  - Trace: user preference “React code frontend”
- UI: modern, intuitive, mobile-first (design requirement)
  - Trace: “Launch Guide → UI/UX: modern, intuitive”; “Website content tone”

### 2.2 Web frontend (marketing)
- Next.js + Tailwind (recommended) for landing page, early access signup, blog/FAQ.
  - Trace: “Website Content” sections and site structure

### 2.3 Backend
- Node.js API service
  - Trace: “Launch Guide → Node.js with microservices architecture”
- PostgreSQL
  - Trace: “Launch Guide → PostgreSQL”
- Redis caching
  - Trace: “Launch Guide → Redis”

### 2.4 Media storage
- Local: MinIO (S3-compatible) for Docker dev
  - Trace: local Docker requirement + cloud object storage implied
- Cloud: S3 (AWS) or GCS (GCP)
  - Trace: “Launch Guide → AWS or Google Cloud”

### 2.5 AI/ML
- TensorFlow / PyTorch (future custom models)
  - Trace: “Launch Guide → AI Services: TensorFlow and PyTorch”
- Optional external emotion APIs (future): Azure Emotion API / Amazon Rekognition
  - Trace: “AI Build Plan → Emotion Recognition APIs”

## 3) Component Architecture (MVP)
- Mobile App (React Native)
- Web Marketing Site (Next.js)
- API (Node.js)
- Postgres (relational data)
- Redis (cache/rate-limits)
- Object storage (MinIO local; S3/GCS later)
- Optional worker (background jobs)
  - Trace: moderation and scaling risks; need for async processing implied

### 3.1 Data flow (core)
1. Signup: Mobile → API → Postgres
   - Trace: signup sequence
2. Upload: Mobile → (MinIO/S3) + API metadata → Postgres
   - Trace: content sharing + CDN concept
3. Feed: Mobile → API → Postgres/Redis
   - Trace: personalized feed
4. Reaction: Mobile → API + storage → Postgres
   - Trace: real-time reactions, reaction chains
5. Report: Mobile → API → Postgres (reports table)
   - Trace: report misconduct

## 4) Minimal Data Model (MVP)
### Entities
- users (id, email, password_hash?, created_at, updated_at)
  - Trace: signup diagram
- profiles (user_id, display_name, avatar_url, bio, interests_json)
  - Trace: profile setup
- groups (id, name, description, created_by, visibility)
  - Trace: community groups
- group_members (group_id, user_id, role, joined_at)
- media_assets (id, storage_key, type, duration, status, created_at)
- posts (id, user_id, group_id?, caption, media_asset_id, privacy_level, created_at)
- reactions (id, post_id, user_id, media_asset_id, created_at)
- reports (id, reporter_id, target_type, target_id, reason, created_at)
- privacy_settings (user_id, profile_visibility, default_post_visibility, blocked_users_json)
  - Trace: privacy controls

## 5) API Contracts (MVP)
> Exact fields TBD; must support PRD requirements.

Auth
- POST /auth/signup
- POST /auth/login
- POST /auth/verify-email (if implemented)
  - Trace: signup sequence + email verification mention

Profile
- GET /me
- PATCH /me/profile
- PATCH /me/privacy

Groups
- GET /groups
- POST /groups
- POST /groups/:id/join
- GET /groups/:id

Posts/Feed
- POST /posts
- GET /feed
- GET /posts/:id

Reactions
- POST /posts/:id/reactions
- GET /posts/:id/reactions

Trust & Safety
- POST /reports

## 6) Media Handling
Local dev: direct upload to MinIO via API proxy or presigned URL.
Cloud: presigned URL upload direct from client → object storage; CDN delivery.
- Trace: “Launch Guide → CDN integration”

## 7) AI Integration (feature-flagged)
### Personalization
- MVP: heuristic (interests + recency)
- Later: model-based ranking (TensorFlow/PyTorch)
  - Trace: personalization engine

### Moderation
- MVP: rules + basic ML vendor checks optional
- Later: classifier + human review tooling
  - Trace: moderation risk + AI build plan tools

### Emotion recognition
- Defer or implement opt-in experimental pipeline
  - Trace: emotion recognition described; privacy risks imply opt-in needed (policy TBD)

## 8) Security & Compliance
- TLS in production; document how to enable locally.
  - Trace: SSL encryption
- Password hashing per signup diagram (if password-based)
- GDPR/CCPA requirements as tracked items (export/delete, consent).
  - Trace: compliance section
- COPPA age gating policy required before public launch.
  - Trace: COPPA mention

## 9) Observability
- Basic structured logs (request id, user id)
- Event logs for key actions (signup, post, reaction, join group, report)
  - Trace: analytics/data collection mention

## 10) Local Docker Setup (constraints)
- docker compose with resource limits for Apple Silicon
- Postgres, Redis, MinIO, API
- Seed data scripts for demo flows
  - Trace: local Docker + hardware constraint
