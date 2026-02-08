# FirstBlush Spec Review (Build-Blocking Findings)
Date: 2026-02-07
Scope: `/firstblush_kiro_spec_bundle` documents

## Findings (highest severity first)

### 1) P0: Auth model is inconsistent across docs
- Evidence:
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/PRD.md` still defines email/password-first flows.
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/FEATURES.md` locks Apple/Google sign-in for v1.
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/ACCEPTANCE_TEST_PLAN.md` tests password hashing and duplicate-email behavior.
- Risk:
  - Engineering and QA can build/test the wrong auth path.
  - Security work can be misprioritized.
- Fix:
  - Treat social auth as source of truth for v1 and move email/password to post-launch optional.

### 2) P0: Platform target mismatch (iOS-only vs iOS+Android)
- Evidence:
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/PRD.md` assumes iOS + Android launch.
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/FEATURES.md` locks iOS-only for public beta.
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/ACCEPTANCE_TEST_PLAN.md` expects iOS/Android simulator paths.
- Risk:
  - Over-scoping mobile implementation and test matrix for a solo team.
- Fix:
  - Update all launch docs and acceptance tests to iOS-only for public beta.

### 3) P1: Feed strategy conflict (personalized MVP vs chronological MVP)
- Evidence:
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/PRD.md` includes personalized feed in MVP requirements.
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/FEATURES.md` locks chronological-first for v1.
- Risk:
  - Unnecessary ranking complexity in MVP.
- Fix:
  - Set v1 feed to chronological only; move ranking to Phase 2+.

### 4) P1: Group model is underspecified in PRD/test plan
- Evidence:
  - Invite/approval is locked in `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/FEATURES.md`.
  - PRD and acceptance tests still describe open join behavior.
- Risk:
  - API and client flows diverge from product intent.
- Fix:
  - Add explicit states: request_pending, approved, rejected.

### 5) P1: Safety scope mismatch
- Evidence:
  - `/Users/shawncutter/git/P2L/FirstBlush/firstblush_kiro_spec_bundle/FEATURES.md` locks block/mute/report only.
  - PRD includes AI-assisted moderation in near-MVP language.
- Risk:
  - Scope creep and delayed ship date.
- Fix:
  - Mark AI moderation as post-beta.

## Recommendation
Freeze v1 in a single addendum and let implementation reference only that addendum for scope control.
