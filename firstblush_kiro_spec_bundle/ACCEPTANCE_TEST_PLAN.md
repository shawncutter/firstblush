# FirstBlush — Kiro-Style Acceptance Test Plan
Version: 0.1 (Derived from provided conversation artifacts)
Status: Draft

## 1) Purpose
Validate the MVP fulfills the functional and non-functional requirements described in the provided artifacts: signup flow, content sharing, real-time reactions, community groups, privacy controls, trust & safety baseline, and local Docker execution.

## 2) Test Environments
Local (required): MacBook 14-inch M2, 36GB RAM; Docker Compose; iOS simulator/Android emulator or device.
- Trace: user local Docker + machine constraints

Production-like (later): AWS/GCP + CDN.
- Trace: “Launch Guide → Cloud Platform + CDN”

## 3) Entry / Exit Criteria
Entry:
- Docker stack starts cleanly.
- API reachable from host.
- Mobile app can connect to API.

Exit:
- All P0 tests pass.
- Local resource usage sanity check passes.
- Basic privacy/security checks pass for MVP readiness.

## 4) P0 Acceptance Tests

### AT-01 Signup happy path
Steps:
1. Open app → tap Signup.
2. Enter email/password (or chosen auth method) → submit.
3. Receive success and proceed to app.
Expected:
- User exists in DB.
- Session token issued.
Trace: “Sequence Diagrams for User Signup”

### AT-02 Client-side validation
Steps:
1. Enter invalid email → submit.
2. Enter weak password → submit.
Expected:
- Error shown; no server call for invalid inputs.
Trace: “Sequence Diagram → App Validates Input”

### AT-03 Server uniqueness + password hashing
Steps:
1. Create user with email X.
2. Attempt second user with email X.
3. Inspect stored credential format.
Expected:
- Duplicate rejected.
- Stored password not plaintext (hashed).
Trace: “Sequence Diagram → Server Verifies Data”

### AT-04 Join community group
Steps:
1. Browse groups.
2. Join one.
Expected:
- Membership stored and visible.
Trace: “Website → Community Groups”

### AT-05 Upload and publish post
Steps:
1. Record/select a video.
2. Upload asset.
3. Publish post with caption to group.
Expected:
- Post visible in group feed; asset retrievable.
Trace: “Launch Guide → Core Development: content sharing”; “Website → Content Creation Tools”

### AT-06 View feed and playback
Steps:
1. Open feed.
2. Play a post.
Expected:
- Playback works for short videos.
Trace: “Website → Explore and Engage”

### AT-07 Record real-time reaction
Steps:
1. Open a post.
2. Tap React; record reaction.
3. Submit.
Expected:
- Reaction linked to post; playable to authorized viewers.
Trace: “Website → Real-Time Reaction Capture”; “Launch Guide → real-time reactions”

### AT-08 Reaction chain display (minimal)
Steps:
1. Open a post with multiple reactions.
2. View chain/thread UI.
Expected:
- Reactions visible in an ordered representation.
Trace: “Launch Guide → Reaction Chains”

### AT-09 Privacy enforcement
Steps:
1. Set post visibility to restricted (e.g., group-only).
2. Attempt access from unauthorized user.
Expected:
- Content hidden or access denied.
Trace: “Website → Enhanced Privacy Controls”; “Core Values → Privacy”

### AT-10 Report misconduct
Steps:
1. Report a post/user.
2. Submit reason.
Expected:
- Report stored; user gets confirmation.
Trace: “Website → Community Guidelines → Report Misconduct”; “Launch Guide → Platform Moderation risk”

## 5) Non-Functional Acceptance Checks (P0)

### NFA-01 Local resource usage
Steps:
1. Start docker compose with limits.
2. Execute AT-01..AT-07.
Expected:
- CPU/RAM stable; no runaway containers; app remains responsive.
Trace: user “be careful not to kill my machine”

### NFA-02 TLS readiness documentation
Expected:
- Document how TLS is configured for staging/prod.
Trace: “Launch Guide → SSL encryption”

### NFA-03 Compliance readiness checklist exists
Expected:
- Document GDPR/CCPA and COPPA readiness tasks.
Trace: “Launch Guide → GDPR/CCPA/COPPA”

## 6) Traceability Matrix
FR-1..FR-4 → AT-01..AT-03  
FR-11 → AT-04  
FR-6..FR-7 → AT-05..AT-06  
FR-8..FR-10 → AT-07..AT-08  
FR-14..FR-15 → AT-09 + doc review  
FR-16..FR-17 → AT-10  
NFR-8 → NFA-01  

## 7) Unknowns requiring added tests
- Final auth approach (password vs OTP vs social login)
- Reaction chain UX rules (depth, branching)
- AI moderation and emotion recognition policies and opt-in UX
Trace: PRD Open Questions
