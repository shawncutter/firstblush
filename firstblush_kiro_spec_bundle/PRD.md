# FirstBlush — Kiro-Style PRD (Product Requirements Document)
Version: 0.1 (Derived from provided conversation artifacts)
Owner: Shawn Cutter (per founding story)
Status: Draft for MVP build

## 1) Product Summary
### 1.1 One-liner / Hook (candidate)
“Experience Moments As They Happen with FirstBlush — the social video platform capturing real-time reactions and authentic connections.”  
**Trace:** “FirstBlush Website Content → Home Page → Hero Section”

### 1.2 What FirstBlush is
A mobile-first social video platform centered on **real-time, authentic reactions** and **meaningful connection**, with **AI-native foundations** for personalization, moderation, and (later) emotion recognition.  
**Trace:** “Comprehensive Company Launch Guide → Executive Summary / Product Overview / AI Integration”; “Website Content → Features → Real-Time Reaction Capture, Community Groups, Personalized Feed, Privacy Controls”

### 1.3 Why it exists (problem statement)
People are dissatisfied with overly curated social media experiences and want more authentic, real-time interaction and stronger privacy controls.  
**Trace:** “Launch Guide → Trends: increased demand for authentic content, real-time engagement, personalized experiences”; “SWOT → Opportunity: dissatisfaction over privacy concerns; demand for authentic content”; “Core Values: Authenticity, Privacy”

## 2) Goals and Non-Goals
### 2.1 MVP Goals
1. Enable users to sign up and create profiles securely.
   - **Trace:** “Sequence Diagrams for User Signup”
2. Enable users to share short-form video content and capture/view real-time reactions.
   - **Trace:** “Launch Guide → Product Overview”; “Website → Real-Time Reaction Capture”
3. Support interest/friend groups (“community groups”) to drive meaningful interaction.
   - **Trace:** “Website → Community Groups”; “Launch Guide → Community focus”
4. Provide privacy controls where users control who sees their content.
   - **Trace:** “Core Values → Privacy”; “Website → Enhanced Privacy Controls”; “Launch Guide → Enhanced Privacy Controls”
5. Prepare a scalable baseline architecture that can run locally in Docker and later deploy to cloud.
   - **Trace:** “Launch Guide → AWS/GCP + CDN”; “User request: run locally in Docker; MacBook M2 resource constraints”

### 2.2 Non-Goals (MVP)
- Full monetization (subscriptions, in-app purchases, ads) in MVP build scope.
  - **Trace:** “Business Model” and “Launch Guide → Revenue Streams” discuss options, but no explicit commitment to implement them in MVP.
- Full emotion recognition surfaced to end-users in MVP.
  - **Trace:** “Launch Guide → Emotion Recognition” is described as a differentiator but not required to demonstrate MVP usability.
- Advanced AR lenses / heavy editing suite.
  - **Trace:** “Business Model → Sponsored lenses”; “Website → Content Creation Tools” mention the concept, but MVP can be minimal.

## 3) Target Users & Personas (from provided docs)
### 3.1 Primary demographic target
- Age: 16–35 (Gen Z + Millennials)
- Tech-savvy; values authenticity; seeks personalized and engaging online experiences.
- Regions with high smartphone/internet penetration (NA/EU/select Asia).
**Trace:** “Launch Guide → Target Market”

### 3.2 Persona set (Appendix B)
- Tech Enthusiast Teenager (16–19): values new experiences and cutting-edge technology.
- Young Professional (20–25): seeks authentic connections and networking opportunities.
- Content Creator (18–30): interested in innovative platforms to reach audiences.
**Trace:** “Launch Guide → Appendices → User Personas”

## 4) Core User Journeys (MVP)
### Journey A: Signup → Profile
1. User opens app → taps Signup.
2. Enters email/password (or email OTP approach; exact method TBD) and submits.
3. App validates inputs, sends to server.
4. Server verifies, stores user in DB, returns confirmation.
5. App confirms signup and prompts email verification if applicable.
**Trace:** “Sequence Diagrams for User Signup”

### Journey B: Discover/Join Community Group → Engage
1. User selects interests → joins community groups.
2. User browses a feed (personalized later; initial can be simple ordering).
3. User reacts to content (real-time reaction capture).
**Trace:** “Website → How It Works”; “Website → Community Groups”; “Launch Guide → AI Personalization Engine”

### Journey C: Create content
1. User records video (minimal editing in MVP).
2. Upload and share to followers/groups.
3. View engagement and reactions.
**Trace:** “Website → Content Creation Tools”; “Launch Guide → Core Development includes content sharing”

## 5) Functional Requirements (MVP)
> Each requirement includes **Priority** and **Trace**. If details are missing, the item is marked **UNKNOWN** and must be resolved.

### 5.1 Account & Identity
- FR-1: User can sign up with email and create an account.
  - Priority: P0
  - Trace: “Sequence Diagrams for User Signup”; “Website → How It Works → Sign Up”
- FR-2: App performs client-side validation (email format, password strength) and shows errors.
  - Priority: P0
  - Trace: “Sequence Diagram → App Validates Input”
- FR-3: Server validates email uniqueness and hashes passwords (if password-based).
  - Priority: P0
  - Trace: “Sequence Diagram → Server Verifies Data”
- FR-4: Email verification prompt/flow exists (**method UNKNOWN**).
  - Priority: P1
  - Trace: “Sequence Diagram step 7: may prompt email verification”

### 5.2 Profiles
- FR-5: User sets up profile (photo, bio, interests).
  - Priority: P1
  - Trace: “Website → How It Works → Personalize Your Profile”

### 5.3 Content: Upload & Share
- FR-6: Users can upload videos and publish posts to their audience/groups.
  - Priority: P0
  - Trace: “Launch Guide → Core Development → content sharing”
- FR-7: App supports viewing videos in a feed experience.
  - Priority: P0
  - Trace: “Website → Explore and Engage”; “Launch Guide → Product Overview”

### 5.4 Real-time Reactions (core feature)
- FR-8: User can record and share immediate reactions to content.
  - Priority: P0
  - Trace: “Website → Real-Time Reaction Capture”; “Launch Guide → real-time reactions”
- FR-9: Reaction objects are stored and linked to original content.
  - Priority: P0
  - Trace: “Website → Share reactions”; implied by feature
- FR-10: Reaction chains: users can see sequences of reactions (stack/link).
  - Priority: P1 (MVP can be minimal representation)
  - Trace: “Launch Guide → Reaction Chains”

### 5.5 Community Groups
- FR-11: Users can join groups based on interests.
  - Priority: P0
  - Trace: “Website → Community Groups”
- FR-12: Users can share content to groups and engage in group contexts (**group chat/messaging UNKNOWN for MVP**).
  - Priority: P1
  - Trace: “Website → Community Groups”; “Website → In-App Messaging (separate feature)”

### 5.6 Personalization & Discovery (lightweight MVP)
- FR-13: App provides a personalized feed based on preferences/interactions (can start simple).
  - Priority: P1
  - Trace: “Website → Personalized Content Feed”; “Launch Guide → AI personalization engine”

### 5.7 Privacy Controls
- FR-14: Users can set privacy settings controlling who sees their content.
  - Priority: P0
  - Trace: “Core Values → Privacy”; “Website → Enhanced Privacy Controls”; “Launch Guide → Enhanced Privacy Controls”
- FR-15: Privacy policy and terms of service are accessible (drafted by legal).
  - Priority: P0 (for launch readiness)
  - Trace: “Website → Privacy Policy / Terms of Service (simplified)”; “Launch Guide → Legal & Compliance”

### 5.8 Trust & Safety (baseline)
- FR-16: Content moderation policies exist; ability to report misconduct.
  - Priority: P0
  - Trace: “Launch Guide → Platform Moderation risk”; “Website → Community Guidelines → Report Misconduct”
- FR-17: AI-assisted moderation may be used to detect/manage inappropriate content (initially can be stubbed/manual workflow).
  - Priority: P1
  - Trace: “Launch Guide → Content Moderation”; “AI Build Plan → Content Moderation tools”

### 5.9 Notifications (optional MVP)
- FR-18: Users receive notifications about relevant activity (**push specifics UNKNOWN**).
  - Priority: P2
  - Trace: implied from “engagement initiatives” and common social patterns; not explicitly specified in provided artifacts.

## 6) Non-Functional Requirements (MVP)
### 6.1 Performance & Scalability
- NFR-1: Platform designed for horizontal scaling as user growth increases.
  - Trace: “Launch Guide → Node.js microservices architecture; scalability issues risk”
- NFR-2: CDN integration for fast content loading (cloud).
  - Trace: “Launch Guide → CDN integration”

### 6.2 Security
- NFR-3: SSL/TLS for all network communications (production).
  - Trace: “Launch Guide → Security: SSL encryption”
- NFR-4: OAuth 2.0 referenced; final auth implementation **UNKNOWN**.
  - Trace: “Launch Guide → Security: OAuth 2.0”
- NFR-5: Passwords hashed (if password-based auth).
  - Trace: “Signup sequence: server hashes password”

### 6.3 Privacy & Compliance
- NFR-6: GDPR/CCPA considerations (consent, deletion, access).
  - Trace: “Launch Guide → Regulatory Compliance”
- NFR-7: COPPA policies for under-13 users (**age gating strategy UNKNOWN**).
  - Trace: “Launch Guide → COPPA”

### 6.4 Local Development Constraint
- NFR-8: Local Docker environment must run on MacBook 14-inch M2 / 36GB without excessive resource use.
  - Trace: user request about local Docker + not killing machine

## 7) Monetization (conceptual; not required for MVP implementation)
- Advertising: display ads, sponsored lenses
- Premium subscriptions: ad-free, exclusive features
- In-app purchases: stickers, effects
- Data analytics services: anonymized trends (high compliance burden)
- Brand collaborations
**Trace:** “Business Model for FirstBlush”; “Launch Guide → Revenue Streams”

## 8) Dependencies & Assumptions
- ASSUMED: iOS + Android at launch.
  - Trace: “Website FAQ: iOS + Android”; “Launch Guide: Flutter cross-platform (note: user preference is React implementation)”
- ASSUMED: Legal will finalize privacy/TOS beyond simplified drafts.
  - Trace: “Website: simplified; consult legal”; “Launch Guide → Legal & Compliance”
- UNKNOWN: “Reaction toll / reciprocity gate” mechanics (requested later, not specified in included artifacts).
  - Trace: later user request list included it, but mechanics not present here.

## 9) Open Questions
- Auth: password vs OTP vs social login (Apple/Google).
  - Trace: signup diagram vs website “email or social login” vs OAuth2 mention
- Group model: creation rules, moderation, caps.
  - Trace: “Community Groups” concept without caps
- Reaction chain UX: representation (stack/tree) and limits.
  - Trace: “Reaction Chains” mention without mechanics
- Emotion recognition policy (opt-in? internal only?).
  - Trace: “Emotion recognition” described broadly
- Age gating / COPPA enforcement rules.
  - Trace: COPPA mention without specifics
