# Law Prep Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an English-language, beginner-friendly law entrance preparation website and responsive learner app, with complete core learning and an optional paid AI guide.

**Architecture:** One npm workspace contains a Next.js public website/API and a separately built React learner app. Supabase provides authentication, Postgres and private storage; versioned content, attempt evidence and server-enforced access are shared across clients. Use one coordinated plan because the learning, assessment, access and AI modules depend on the same contracts; each task still delivers a separately testable increment.

**Tech Stack:** TypeScript, React, Vite, React Router, Next.js App Router, Supabase Auth/Postgres/Storage, Zod, Vitest, Testing Library and Playwright. Use npm workspaces without an additional orchestration framework. Resolve compatible supported stable versions at setup, record exact versions and retain the lockfile; do not copy July dependency versions.

**Spec:** `docs/superpowers/specs/2026-10-16-law-prep-platform-design.md`, approved 23 October 2026. This plan supersedes the July implementation plan.

**Accepted engineering supplement:** `docs/implementation/2026-10-23-infrastructure-and-discipline-proposal.md` records the reference-repository review and the engineering discipline accepted by the owner on 24 October 2026. Implement the discipline baseline before product behavior. Infrastructure alternatives remain provisional; provider provisioning and hosted GitHub settings are not approved/configured by this acceptance.

**Accepted coding supplement:** `docs/implementation/2026-10-23-coding-standards-proposal.md` maps reference-repository coding practices to Law Prep, including semantic writer/reader contracts, canonical projections, cache identity/invalidation, error-vs-empty distinction, runtime authorization and transactional concurrency. Apply these rules through Task 0 and their owning feature tests. Budget direction is free-tier-first; managed Supabase Free is the initial preference, commercial web hosting remains to be settled, and Oracle self-hosting is an alternative rather than an assumed migration.

**Accepted industry baseline:** `docs/research/2026-10-23-engineering-standards.md` was accepted on 24 October 2026: lean standard tooling, applicable OWASP ASVS mapping, concise threat model, WCAG 2.2 AA verification target and separate software/content/operational acceptance. Content-dispute handling is included in Task 11a. These are implementation/release requirements, not claims of active checks or completed conformance. Keep Task 0 orchestration thin and activate behavior checks in their owning feature tasks.

## Global Constraints

- CLAT UG is primary. BLET means Patna University/Patna Law College three-year LLB. CUET-PG LLB remains included; verify cycle-specific paper codes and institutional mappings.
- English at launch. No video teaching, live classes or human mentorship. Owner/editor content review remains necessary.
- Explore is free; Prepare provides complete core preparation; AI Guide is optional. Prices and commercial activation are unresolved.
- Preserve `LexCommand.html`, research, PDFs and historical documents. Imports are copies with provenance, never automatic endorsements.
- No commit, push, public deployment, external service provisioning, real payments or APK/iOS build without the corresponding explicit instruction.
- Implement locally and online-first. Home-screen metadata does not imply offline lessons, offline tests, notifications or native store readiness.
- Never expose answer keys before the relevant assessment finishes, trusted credentials, another student's records, or unpublished editorial content to learners.
- Server calculations own scoring, deadlines, entitlements and usage. AI cannot mutate targets, scores, content publication or payments.
- No national rank predictions, guaranteed admission or mastery inferred from a single answer. Preserve history after access expires or targets change.
- A labelled pilot can use incomplete content; a complete-preparation claim requires the published coverage gate for that exam to pass.

## Review Focus

1. Reconnects and simultaneous devices must not overwrite newer answers, extend deadlines or count the same work twice — Tasks 8 and 9.
2. Unknown attempt dates, skipped diagnostics and changed targets must yield usable plans while preserving history — Tasks 6 and 7.
3. Malformed imports, withdrawn questions and corrected keys must not leak into new scored tests or silently alter past scores — Tasks 2, 3 and 8.
4. Expiry during a mock, replayed payment events and concurrent AI requests must preserve earned work and enforce account-level access — Tasks 5, 12 and 14.
5. Missing sources, misleading prompts and provider failures must leave the core course usable without fabricated guidance or assessment assistance — Tasks 13 and 14.

---

## Package and file map

Paths below are relative to the workspace root. All listed source files are new unless marked otherwise. Co-locate additional feature components beside their page when they become necessary; do not create unused scaffolding.

| Location | Responsibility |
| --- | --- |
| `package.json`, `package-lock.json`, `tsconfig.base.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `.gitignore` | Workspace, scripts, version lock, test environments, safe local configuration |
| `apps/site/app/page.tsx`, `guides/[slug]/page.tsx`, `pricing/page.tsx` | Searchable public discovery and tier information |
| `apps/site/app/api/v1/[...path]/route.ts`, `apps/site/src/http.ts` | Explicit HTTP route registry, validated requests and error mapping |
| `apps/site/app/admin/page.tsx`, `apps/site/src/admin/*` | Owner-only import review, publishing and corrections |
| `apps/site/next.config.ts`, `scripts/stage-learner.ts` | Serve the independently built learner assets at `/study/` |
| `apps/learner/vite.config.ts`, `src/main.tsx`, `src/router.tsx`, `src/styles.css` | Responsive learner shell and navigation |
| `apps/learner/src/features/{auth,onboarding,plan,lesson,tests,review,revision,progress,current-affairs,ai,account}/*` | Feature screens and feature-specific state |
| `apps/learner/src/platform.ts`, `public/manifest.webmanifest`, `public/icons/*` | Browser platform adapter and installation metadata |
| `packages/contracts/src/{content,exam,learner,assessment,access,ai,http}.ts` | Zod schemas and inferred request/response types; no server dependencies |
| `packages/domain/src/{plan,evidence,revision,score}.ts` | Pure deterministic learning and assessment rules |
| `packages/api-client/src/index.ts` | Typed HTTP client, authenticated transport, retry boundaries |
| `packages/server/src/{auth,db,catalog,publication,access,onboarding,learning,attempts,progress,revision,billing,ai}.ts` | Server-only services, authorization and transactions |
| `packages/server/src/providers/{ai,billing}.ts` | Provider interfaces and explicit development adapters |
| `scripts/{extract-lexcommand,inventory-content,check-coverage}.ts` | Repeatable extraction, source audit and coverage checks |
| `content/imports/`, `content/editorial/`, `content/coverage/` | Generated draft imports, reviewed source records and exam coverage manifests |
| `supabase/config.toml`, `supabase/migrations/`, `supabase/tests/database/` | Local database, CLI-generated migrations, real isolation/transaction tests |
| `tests/{unit,integration,e2e,fixtures,ai-evals}/` | Meaningful test cases, synthetic fixtures and evaluation sets |
| `docs/implementation/{setup,content-audit,rules,release-checklist,mobile-handoff}.md` | Operational evidence, explicit rules and release limits |
| `docs/engineering/{discipline,threat-model,accessibility}.md`, `docs/engineering/{contracts,security-requirements}.json` | Accepted working rules, key data contracts, applicable versioned security controls and accessibility verification scope |
| `packages/server/src/content-issues.ts`, `apps/learner/src/features/review/ReportContentIssue.tsx`, `apps/site/src/admin/content-issues.tsx` | Student content reports and owner editorial triage |

## Shared contracts and storage rules

Task 1 creates the schemas below; later tasks extend those named files rather than inventing parallel DTOs. `Id`, `VersionId` and `IsoTime` are validated strings; durations and study budgets are integer seconds/minutes as named; currency uses integer minor units.

- `ExamId = 'clat-ug' | 'blet-patna-llb' | 'cuet-pg-llb'`. An `ExamCycle` has `id`, `examId`, `label`, nullable `examAt`, `sourceRefs`, `verifiedAt`, `status: 'draft'|'published'`, versioned section/question structure, `durationSeconds`, rational mark/penalty values and documented accommodation overrides. Fixtures are marked synthetic, never official exam facts.
- `SourceRef = {id,url?,localPath?,title,publisher,checkedAt,rights:'unknown'|'permitted'|'restricted'}`. `ContentVersion` has `id`, `logicalId`, `kind`, `examMappings`, `topicIds`, `sourceRefs`, `status:'draft'|'reviewed'|'published'|'withdrawn'`, `supersedes?` and payload. Question payloads retain passage grouping, type, options, source classification and original-paper/year claims. Store private keys/explanations separately from pre-submission question DTOs.
- `LearnerProfile = {primaryExam:ExamId|null,secondaryExams:ExamId[],cycleId:Id|null,minutesPerDay:number,familiarity:'new'|'some'|'experienced',timezone:string,revision:number}`. Timezone defaults to the browser's zone; deadline enforcement uses UTC server time.
- `LearningEvent = {id,userId,topicId,contentVersionId,kind:'covered'|'answer'|'recall',at,correct?:boolean,assisted:boolean,exposure:'fresh'|'repeat',questionFamilyId?:Id}`. Only server-validated submissions produce scored answer events. A hint or full explanation marks assistance before subsequent evidence is accepted.
- `PlanItem = {id,topicId,activity:'lesson'|'practice'|'revision'|'test',estimatedMinutes,reason}`; `StudyPlan = {id,revision,items:PlanItem[],generatedAt}`. `PlanInput` combines profile, curriculum prerequisites, evidence, due reviews and the injected clock. `PlanProposal = {id,baseRevision,items:PlanItem[],explanation}`.
- `Attempt = {id,examCycleVersionId,questionVersionIds,status:'active'|'submitted'|'expired',startedAt,deadlineAt,revision,accessSnapshot}`. `AnswerPatch = {questionVersionId,selectedOptionIds:Id[],expectedRevision:number,mutationId:Id}`. `ScoreReport` includes exact score, max score, section/topic breakdown, timing, frozen key versions and review items. Model essay types only when genuinely required by a verified exam configuration.
- `TopicEvidence` contains coverage state, fresh/assisted/repeated counts, independent accuracy, distinct question-family count, later recall results, last evidence dates, `understanding:'insufficient'|'developing'|'supported'` and human-readable reasons. `ReviewItem` has topic, due time, recall/application type and scheduler version.
- `AccessSnapshot = {prepareExamIds:ExamId[],prepareUntil:IsoTime|null,aiUntil:IsoTime|null,state:'trial'|'active'|'expired'|'cancelled',aiRemaining:number}`. `Action = 'readSample'|'startLesson'|'startTest'|'finishAttempt'|'readHistory'|'useAi'`.
- `AiRequest = {requestId,mode:'discover'|'tutor'|'plan'|'mock-review'|'revision',message,lessonVersionId?,attemptId?}`. `AiReply = {text,citations:SourceRef[],proposal?:PlanProposal,remaining:number,status:'answered'|'unsupported'|'unavailable'}`. `GroundedContext` contains only authorized approved excerpts, permitted completed-attempt review and deterministic student evidence. `AiProvider.generate(context:GroundedContext,request:AiRequest):Promise<{text:string,citedSourceIds:Id[],proposal?:PlanProposal,usage:{inputTokens:number,outputTokens:number}}>`.
- `BillingEvent = {provider,eventId,subscriptionId,userId,version:number,state,prepareExamIds,prepareUntil,aiUntil}`; provider-signature validation precedes normalization. A `BillingProvider.verify(rawBody:Uint8Array,headers:Headers):Promise<BillingEvent>` port keeps merchant choice out of entitlement logic.
- `ApiResult<T> = {data:T}|{error:{code:'UNAUTHENTICATED'|'FORBIDDEN'|'INVALID_INPUT'|'CONFLICT'|'EXPIRED'|'QUOTA_EXHAUSTED'|'UNAVAILABLE',message:string,currentRevision?:number}}`. HTTP status mapping is 401/403/400/409/410/429/503. Authenticated responses use `Cache-Control: private, no-store`.

Persist profiles, target history, plans/proposals, learning events, attempts/answers, reviews, notes, subscriptions, payment-event receipts, AI reservations/usage/conversations and editorial audit entries. Use normalized ownership/version columns and immutable content versions; JSONB is suitable for versioned payloads, not ownership or uniqueness constraints. Index ownership plus retrieval keys, revision/due-time lookups and foreign keys used by policies. Uniqueness constraints cover user+mutation, provider+event and attempt+question. Answer keys, role assignments, subscription mutations, AI reservations and payment receipts are server-owned, outside directly accessible learner tables.

User-visible writes run with verified identity and row policies. Narrow server transactions handle scoring/access/quota operations; if a privileged function is required, place it outside exposed schemas, set its search path, check the caller/owner, revoke public execution and explicitly grant only the intended backend role. Do not accept a submitted `userId` as ownership, user-editable metadata as an admin role, or UI gating as access enforcement.

## Verification commands established in Task 1

Root scripts: `npm run test:unit -- <file>`, `npm run test:integration -- <file>`, `npm run test:db`, `npm run test:e2e -- <file>`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run content:audit`, `npm run content:check`, `npm run eval:ai`.

Unit/integration use Vitest with separate configs; database-dependent integration tests and DB tests use real local Supabase/Postgres, not mocked RLS. Task 1's transport tests require only a local HTTP server. E2E uses seeded synthetic local accounts/content and the built site. `test:db` wraps the installed Supabase CLI's documented database-test command. Missing local database prerequisites must produce an explicit blocked check, never a passing skip. Inspect CLI `--help` before scripting commands. Local email capture supports email OTP development without a hosted mail service. Every task adding user-owned tables extends `supabase/tests/database/ownership.test.sql` with two-account read/write isolation checks for those tables.

## Phase 1 — reliable foundation and beginner learning

### Task 0: Accepted engineering baseline before product code

**Files:** `AGENTS.md`; `docs/engineering/{discipline,threat-model,accessibility}.md`; `docs/engineering/{contracts,security-requirements}.json`; `docs/engineering/reviews/`; `docs/diagnoses/INDEX.md`; `quality-gates.json`; `scripts/verify.mjs`; `scripts/check-review-record.mjs`; `tests/process/verify.test.mjs`; `.github/workflows/ci.yml`; root package scripts and hooks. No files in reference repositories are edited.

**Interfaces:** `runGates(registry,context):Promise<{passed:boolean,results:{id,status:'PASS'|'FAIL'|'BLOCKED'|'NOT_APPLICABLE',reason?:string,evidence?:string}[]}>`. `context` identifies milestone, changed files, risk tier and exact code/diff fingerprint. CLI `node scripts/verify.mjs` exits nonzero for any applicable required gate without PASS. `SecurityRequirement = {standard:'ASVS',version:string,requirementId:string,applicability:'applicable'|'not-applicable',ownerTask:string,testPaths:string[],status:'pending'|'verified'|'failed'|'blocked',evidence:string}`; IDs must resolve against the selected official release, and non-applicability requires a rationale in evidence. Bootstrap tests use Node's built-in test runner; Task 1 extends the minimum root package/workspace with product tooling.

- [x] Write failing `tests/process/verify.test.mjs` assertions: a successful required command yields PASS; a failing command, unavailable tool, empty required report or skipped required test makes `passed === false`; an explicitly inapplicable future-phase gate is identified without claiming its behavior passed. Review records with a stale fingerprint or missing required independent review are rejected. Fixtures prove workflow/runner wiring invokes registered gates. Security-map entries without verified standard/version/owner are invalid; a pending applicable launch requirement cannot count as verified.
- [x] Run `node --test tests/process/verify.test.mjs`; confirm failures before implementing runner/validator.
- [x] Implement the accepted supplements as short portable rules and one thin verification entry point, initially process checks only. Map applicable ASVS requirements to owning tasks and write a concise threat model for learner/editor/anonymous actors, account records, keys, scoring, billing and AI boundaries. Record WCAG 2.2 AA as a verification target, with manual evidence required. Add product checks/contracts in their owning tasks; use standard tools before bespoke scanners. Require independent high-risk plan review before implementation and code/security review afterward; normal features get one independent code review and low-risk copy/style work gets focused checks/self-review. Keep hooks fast; CI uses the same registry. Record reference snapshots and retain separate commit/push/activation boundaries. Preparing workflows does not configure branch protection or authorize pushing them.
- [x] Run process tests and `npm run verify`. After an authorized GitHub push, separately verify actual required checks, branch/ruleset settings, preview isolation and manual production promotion. Before that, label hosted enforcement unconfigured; local success alone cannot satisfy a production-release gate.

### Task 1: Independently buildable learner and typed API boundary

**Files:** Workspace/config files; `apps/site/app/api/v1/[...path]/route.ts`; `apps/site/src/http.ts`; learner shell, platform adapter and Vite config; contracts and API client; `scripts/stage-learner.ts`; `tests/integration/transport.test.ts`; `tests/e2e/build-boundary.spec.ts`; setup documentation.

**Interfaces:** Produce the shared schemas above, `createApiClient({baseUrl,getAccessToken}):ApiClient`, `dispatch(request:Request):Promise<Response>` and `Platform = {apiBaseUrl:string,now():Date}`. API paths start `/api/v1`; learner uses a hash router under `/study/` to avoid native/static deep-link fallbacks. Vite assets use relative base paths.

- [x] Establish the minimum workspace/test runner and write failing assertions: `expect(await client.health()).toEqual({ok:true})`; invalid request schemas reject malformed identifiers. E2E `standaloneLearnerHasNoServerImports` asserts static assets mount the shell and built client contains no server credentials or server-only imports.
- [x] Run the two named test files; record the expected missing route/build failures.
- [x] Implement `GET /health`, validated route registry and typed transport. Stage the learner's Vite output under site `public/study/` during root build; no runtime dependency on the Vite dev server. In development the site may proxy `/study/` to Vite. Set exact compatible dependency versions, Node engines, lockfile and environment validation. Read current repository state before choosing a safe integration location; preserve all local files, never reset/overwrite the root.
- [x] Run both files, typecheck and build. Confirm the site serves `/study/#/` and the same learner output is independently statically servable. Record the version table and local startup commands; no Git mutation.

### Task 2: Repeatable content inventory and exam coverage ledger

**Files:** Extraction/inventory scripts; `packages/contracts/src/content.ts`; `content/imports/manifest.json`; `content/coverage/{clat-ug,blet-patna-llb,cuet-pg-llb}.json`; `docs/implementation/content-audit.md`; `tests/unit/import.test.ts`.

**Interfaces:** `extractLegacy(html:string):ImportBatch`, `auditSources(root:string):Promise<InventoryReport>`; `ImportBatch` contains original record IDs, source hash, parsed records, errors and counts. `InventoryReport` records source counts, duplicates, missing explanations, flags, rights and unmapped topics. `CoverageRow` maps exam/cycle/topic to required objectives, teaching, fresh practice, revision and assessment requirements with reviewer and status.

- [x] Test `importIsDeterministicAndNeverPublishes`: `expect(secondBatch).toEqual(firstBatch)`; `expect(batch.records.every(r=>r.status==='draft')).toBe(true)`; malformed answers are reported, not dropped; HTML/script payloads remain inert. Assert source hashes do not change.
- [x] Run `npm run test:unit -- tests/unit/import.test.ts` and confirm missing implementation failures.
- [x] Implement extraction without executing embedded scripts: JSON parsing where valid and AST/literal extraction for JavaScript structures. Inventory lessons, questions, curriculum, decks/blueprints and PDF metadata; report unsupported structures. Compare extracted counts with the historical inventory, explaining discrepancies rather than forcing them. Verify current syllabus/configuration sources for all three routes using official publications; unavailable facts remain draft. Treat analogue papers distinctly.
- [x] Run the test and `npm run content:audit`. Populate exact per-topic content-production requirements from the verified syllabus and editorial audit; list existing usable assets, missing deliverables, review owner and source/rights blockers. Do not derive course completeness from record counts or verification booleans.

### Task 3: Secure versioned catalog and owner publication

**Files:** `packages/server/src/{auth,db,catalog,publication}.ts`; `apps/site/app/admin/page.tsx`; admin feature files; CLI-generated migrations; `supabase/tests/database/catalog.test.sql`; `tests/integration/publication.test.ts`.

**Interfaces:** `getPublishedCatalog(examId:ExamId):Promise<Catalog>`; `publishVersion(actor:VerifiedActor,id:VersionId):Promise<ContentVersion>`; `correctVersion(actor,id,replacement):Promise<ContentVersion>`; `requireActor(request:Request):Promise<VerifiedActor>`. `Catalog` contains published cycles, topic/prerequisite maps and content summaries, never private answer keys. `VerifiedActor = {userId:Id,role:'learner'|'publisher'}` is created only server-side. Implement minimal verified-token/admin authorization here; Task 4 adds the learner sign-in experience and session lifecycle.

- [ ] Assert anonymous catalog omits draft/restricted items, ordinary learners cannot publish, missing permitted sources/review blocks publication, correction creates a new version, and withdrawal removes future availability while preserving historical references. DB assertions prove exposed tables have RLS and correct grants, and answer-key relations cannot be read by anonymous/authenticated roles.
- [ ] Run publication and database tests; confirm failure before schema/services exist.
- [ ] Initialize local Supabase after checking runtime prerequisites. Generate migrations with the installed CLI's migration-creation command, retaining its timestamped filenames. Add version/source/mapping/audit storage, policies and owner-only publication UI with import preview, explanation/source review, publish/correct/withdraw actions. Editorial source documents use private storage with publisher-only policies; learner access to any permitted asset requires an authorized signed URL. Sanitize rendered rich content; no raw untrusted HTML. Owner roles live in a server-owned relation. Test authorization with seeded local Auth tokens before the sign-in UI arrives.
- [ ] Run both suites and audit import-to-publication round trips on synthetic content. No real imported item is auto-published.

### Task 4: Account creation, isolation and saved state

**Files:** `packages/server/src/auth.ts`; auth feature; API auth routes; profile/history migrations; `tests/integration/auth.test.ts`; `supabase/tests/database/ownership.test.sql`; `tests/e2e/auth.spec.ts`.

**Interfaces:** `requireActor(request:Request):Promise<VerifiedActor>`; API client token source from the learner Supabase Auth client. Start with email OTP sign-in, sign-out and recovery via OTP. Use bearer access tokens over HTTPS; verify with supported current Supabase server APIs, never trust local session data alone.

- [ ] Assert user A cannot read/write B's profile or target history even when guessing IDs; forged/expired tokens return 401, forged admin metadata grants nothing, and sign-out clears visible student data. Later tasks add notes/attempt/conversation isolation checks when those tables exist. E2E asserts a public landing page browses without login and two signed-in browsers share a seeded saved profile state; Task 6 supplies editing and full guides.
- [ ] Run auth, ownership and E2E files; confirm missing protections fail.
- [ ] Implement authentication, session refresh, safe redirect allowlist, private response caching rules, request-scoped DB clients and ownership policies with update `USING`/`WITH CHECK`. Do not cache authenticated responses across students. Never ship privileged keys to clients.
- [ ] Run all three files against real local auth/database. Record hosted email/domain configuration as a future operational step.

### Task 5: Central access checks and free sample journey

**Files:** `packages/server/src/access.ts`; access contracts; subscription migrations; `tests/integration/access.test.ts`; learner account/access feature; pricing page.

**Interfaces:** `getAccess(actor:VerifiedActor,at:Date):Promise<AccessSnapshot>`; `canAccess(access:AccessSnapshot,action:Action,resource:AccessResource):AccessDecision`. `AccessResource` identifies exam, sample flag and optional existing attempt/access snapshot; `AccessDecision={allowed:boolean,reason?:string}`. API services consume these checks, never a client-provided tier.

- [ ] Assert Explore can save progress and complete the designated sample unit/mock; full lessons/tests need valid exam access; expired users retain history; AI requires active Prepare plus AI allowance. `expect(finishAlreadyStartedAfterExpiry.allowed).toBe(true)` and `expect(startNewPaidMockAfterExpiry.allowed).toBe(false)`.
- [ ] Run access tests and confirm failures.
- [ ] Implement server-owned entitlement fixtures and checks at content/action boundaries. Publish honest tier copy without invented prices or enabled checkout; standard explanations remain part of core access. Seed samples separately from complete-course content.
- [ ] Run access tests and inspect tier/sample catalog responses; Task 7 verifies the complete sample learning journey. Ensure restricted payloads are absent from free responses, not merely hidden by CSS.

### Task 6: Public guides, onboarding and optional diagnostic

**Files:** Public guide pages; learner onboarding feature; `packages/server/src/onboarding.ts`; profile/catalog endpoints; `tests/integration/onboarding.test.ts`; `tests/e2e/beginner.spec.ts`.

**Interfaces:** `saveProfile(actor,profile:LearnerProfile,expectedRevision:number):Promise<LearnerProfile>`; `getDiagnostic(actor,examId):Promise<DiagnosticDto>`; `submitDiagnostic(actor,answers):Promise<DiagnosticSummary>`. Diagnostic questions are tagged and excluded from subsequent fresh checks. API endpoints: `GET /catalog?examId=`, `GET|PUT /profile`, `GET|POST /diagnostic`.

- [ ] Assert skipped diagnostic and nullable target date save successfully; target changes preserve old evidence and target history; stale profile writes return CONFLICT. Browser test follows public career/degree/exam guidance through target selection and skip to foundations for each ExamId.
- [ ] Run onboarding and beginner tests; confirm missing behavior fails.
- [ ] Implement sourced public guides, clear five-year/three-year routes, primary/secondary targets, availability and familiarity. Permit undecided choices and later editing. Build a low-pressure diagnostic summary with limited-evidence language, never mastery from one item. Use the accepted navy/amber direction, readable headings and mobile navigation across all product areas.
- [ ] Run both files, checking sources are visible and no fabricated countdown appears for unknown dates.

### Task 7: Rule-based study plan and content-led lesson experience

**Files:** `packages/domain/src/plan.ts`; `packages/server/src/learning.ts`; plan/lesson features; plan/event/notes migrations; `docs/implementation/rules.md`; `tests/unit/plan.test.ts`; `tests/e2e/lesson.spec.ts`.

**Interfaces:** `buildPlan(input:PlanInput):StudyPlan`; `recordLearning(actor,event:LearningEvent,mutationId:Id):Promise<{eventId:Id,coverage:'pending'|'in-progress'|'covered'}>`; `getLesson(actor,id:VersionId):Promise<LessonDto>`; `submitPractice(actor,questionId:VersionId,selectedOptionIds:Id[],mutationId:Id):Promise<{correct:boolean,explanation:string,eventId:Id}>`. Lesson DTO explicitly contains objective, prerequisites, explanation, worked example, supported/independent items and review links, withholding independent-item solutions until answer/help is requested. Endpoints `GET /plan`, `GET /lessons/:id`, `POST /learning-events`, `POST /practice/:id/answers`, `PUT /notes/:topicId`.

- [ ] Assert plan allocations fit available minutes, prerequisites precede dependent units, due revision receives priority and missed days reschedule without mandatory accumulating backlog. Unknown date still yields a foundation routine. Browser test asserts hint use sets assistance, repeated items stay repeated, notes save and completion updates coverage without asserting understanding.
- [ ] Run plan and lesson tests; confirm missing implementation failures.
- [ ] Implement deterministic priority: overdue review, unmet prerequisites, weak independent evidence, then next mapped unit, capped by daily minutes; stable ties use curriculum order. Split long lessons into resumable activities. Document configurable estimates/rules; permit browsing, skipping and schedule changes. Persist events idempotently and notes with revision checks. Ignore supplied ownership and reject client-written correctness; `submitPractice` grades against private keys and emits answer evidence. Before Task 9's full evidence aggregation, use recorded coverage/counts with conservative insufficient-evidence labels; before Task 10, due reviews are an empty list.
- [ ] Run tests and show one complete sample unit from explanation to later review. Plans and normal feedback work without AI.

## Phase 2 — assessment, retention and complete exam paths

### Task 8: Frozen, resumable, server-scored tests and mocks

**Files:** `packages/domain/src/score.ts`; `packages/server/src/attempts.ts`; tests feature; attempt/answer/key migrations; `tests/unit/score.test.ts`; `tests/integration/attempts.test.ts`; `tests/e2e/mock.spec.ts`.

**Interfaces:** `startAttempt(actor,testId:Id,mutationId:Id):Promise<AttemptDto>`; `saveAnswer(actor,attemptId:Id,patch:AnswerPatch):Promise<{revision:number}>`; `submitAttempt(actor,attemptId:Id,mutationId:Id):Promise<ScoreReport>`; `resumeAttempt(actor,id):Promise<AttemptDto>`. `AttemptDto` omits keys/explanations and includes saved answers, revision, serverNow and deadline. Endpoints `POST /attempts`, `GET /attempts/:id`, `PUT /attempts/:id/answers`, `POST /attempts/:id/submit`, `GET /attempts/:id/report`.

- [ ] With explicitly synthetic marking +4/-1/0, assert one correct, one wrong and one blank scores 3; test rational precision, section structure and allowed accommodation duration. Assert published correction does not alter an existing attempt's frozen score; withdrawal prevents new selection. Reconnect keeps deadline, duplicate starts/submits are idempotent and two conflicting device writes return 409 rather than overwrite.
- [ ] Run all three files; verify failed deadline/key-leak/concurrency assertions before implementation.
- [ ] Implement transactional version snapshots, server deadlines and authoritative scoring; accept only answers received before the deadline. Autosave with visible pending/saved/conflict states; resume fetches current revision. On conflict keep the unsaved local choice visible and ask which to apply against current state. Timer uses server offset for display; expired attempts finalize on the next read/write without trusting a browser callback. Topic/section/past-paper/full mock selectors use verified cycle blueprints. Past-paper claims require verified provenance.
- [ ] Run suites against the real local database, refresh mid-test and simulate connection loss. Finish/review remains valid after subscription expiry; no mock is interrupted for an upsell.

### Task 9: Mistake review and explainable progress evidence

**Files:** `packages/domain/src/evidence.ts`; `packages/server/src/progress.ts`; review/progress features; `tests/unit/evidence.test.ts`; `tests/integration/review.test.ts`; `tests/e2e/progress.spec.ts`.

**Interfaces:** `deriveEvidence(events:LearningEvent[],at:Date,policy:EvidencePolicy):TopicEvidence[]`; `getProgress(actor,examId):Promise<ProgressReport>`; `saveMistakeNote(actor,attemptId,questionId,note):Promise<void>`. `ProgressReport` contains per-topic evidence plus distinct coverage/practice/understanding/retention/performance summaries, never a merged mastery percentage. Review notes include learner-chosen classification and next activity links.

- [ ] Assert one correct answer remains insufficient; assisted/repeated/diagnostic events cannot masquerade as fresh independent evidence; replayed mutation produces one event; target switches retain evidence but change syllabus mapping. Assert corrections show original score/version and any separately requested recalculation as labelled output.
- [ ] Run the three files; confirm missing behavior fails.
- [ ] Implement configurable initial evidence labels: fewer than 5 fresh independent checks across 3 question families = insufficient; otherwise accuracy >=80% = supported, else developing. These are transparent product heuristics, not validated readiness claims. Retention additionally requires a successful later check at least 24 hours after initial study. Show dates/counts and keep coverage independent. Review offers standard explanations, learner reasoning, notes and targeted practice.
- [ ] Run suites; verify a student can identify pending, covered, needs-practice and due-review states and see the evidence behind each.

### Task 10: Revision, notes and dated current affairs

**Files:** `packages/domain/src/revision.ts`; `packages/server/src/revision.ts`; revision/current-affairs features; revision migrations; `tests/unit/revision.test.ts`; `tests/integration/current-affairs.test.ts`.

**Interfaces:** `scheduleReview(previous:ReviewItem|null,result:RecallResult,at:Date,policy:RevisionPolicy):ReviewItem`; `listDue(actor,at:Date):Promise<ReviewItem[]>`; `listCurrentAffairs(actor,examId,cursor?):Promise<CurrentAffairsPage>`. Recall result records correct/assisted and fact/application type. Endpoints `GET /revision`, `POST /revision/:id/result`, `GET /current-affairs`.

- [ ] Assert initial successful review schedules 1 day, later unassisted successes use 3/7/14/30-day configurable intervals, and incorrect/assisted responses return to a 1-day review. UTC scheduling and local due-date display handle timezone changes consistently. Current-affairs test asserts source/date/correction trail survives replacement and draft news is absent.
- [ ] Run the two files; confirm expected failures.
- [ ] Implement scheduler v1, configurable policy and separate fact recall/application queues. Offer notes/flashcards plus fresh practice, not flashcards alone. Current affairs use the same editorial lifecycle and relevant exam mappings. Document heuristic limits and scheduler version with each scheduled review.
- [ ] Run suites; ensure ordinary revision continues when AI is unavailable and its results update retention evidence without duplicating events.

### Task 11: Editorial production and complete-path coverage gates

**Files:** `scripts/check-coverage.ts`; three coverage manifests; `content/editorial/*`; admin coverage view; `docs/implementation/content-audit.md`; `tests/unit/coverage.test.ts`; `tests/e2e/exam-paths.spec.ts`.

**Interfaces:** `checkCoverage(catalog:Catalog,manifest:CoverageManifest):CoverageResult`; `CoverageResult={complete:boolean,gaps:{topicId,requirement,missingIds}[],blockedSources:Id[]}`. Manifest requirements come from Task 2's verified audit, including assessed question structures, not arbitrary global bank counts.

- [ ] Assert a missing required explanation, lesson objective, fresh-practice family, review activity or exam blueprint blocks completeness; wrong-route analogue papers cannot satisfy authentic past-paper requirements. All three exam-path browser fixtures must finish discovery, learning, revision, mock, review and updated plan.
- [ ] Run coverage and exam-path tests; expect explicit gaps for unreviewed imports, not manufactured success.
- [ ] Produce/review the exact missing teaching, practice, revision, current affairs and test assets recorded by the audit; verify answers/sources/rights and publish only approved versions through Task 3. Owner handles editorial decisions; AI drafting, if used, remains draft. Expose coverage status in admin and label incomplete routes as pilots. Keep all three exam paths in the production backlog.
- [ ] Run `npm run content:check` and exam-path E2E. Save gap counts and named blockers per exam. This task is incomplete until required assets are reviewed; working software alone does not satisfy full preparation scope.

### Task 11a: Student content reports and editorial resolution

**Files:** `packages/contracts/src/content.ts`; `packages/server/src/content-issues.ts`; `apps/learner/src/features/review/ReportContentIssue.tsx`; `apps/site/src/admin/content-issues.tsx`; CLI-generated content-issue migration; `supabase/tests/database/ownership.test.sql`; `tests/integration/content-issues.test.ts`; `tests/e2e/content-issues.spec.ts`.

**Interfaces:** `ContentIssue = {id:Id,contentVersionId:VersionId,category:'answer'|'explanation'|'source'|'exam-mapping'|'other',message:string,status:'open'|'resolved',createdAt:IsoTime}`. `reportContentIssue(actor,input:{contentVersionId,category,message},mutationId:Id):Promise<ContentIssue>`; `resolveContentIssue(actor,id:Id,resolution:{note:string,replacementVersionId?:VersionId}):Promise<ContentIssue>`. Endpoints `POST /content-issues`, `GET /content-issues/mine`, `GET /admin/content-issues`, `POST /admin/content-issues/:id/resolve`.

- [ ] Assert a student can report a version they are allowed to access, including a completed historical attempt after access expiry; guessed inaccessible versions and other students' reports remain forbidden. Duplicate mutation creates one report; oversized messages fail validation. An ordinary learner cannot resolve a report, and reporting/resolving alone never changes a key or past score.
- [ ] Run `npm run test:integration -- tests/integration/content-issues.test.ts` and `npm run test:e2e -- tests/e2e/content-issues.spec.ts`; confirm missing behavior fails.
- [ ] Implement authenticated reporting, owner-only queue/triage, a 2,000-character server message limit and configurable account-level rate limits. Keep reporter identity private to the reporter and authorized owner. Resolution may link a correction produced through Task 3's publication workflow; it cannot directly rewrite content/attempts. Store immutable version references, resolution/audit history and ownership policies.
- [ ] Run both suites plus real ownership tests. Demonstrate report -> owner review -> linked versioned correction while the original attempt remains reproducible. Add content-report handling to the editorial release evidence; do not promise an unstaffed response-time SLA.

## Phase 3 — commercial infrastructure and optional AI

### Task 12: Test-mode billing events and entitlement lifecycle

**Files:** `packages/server/src/billing.ts`; billing provider port; receipt/subscription migrations; account/pricing features; `tests/integration/billing.test.ts`; `docs/implementation/release-checklist.md`.

**Interfaces:** `applyBillingEvent(event:BillingEvent):Promise<'applied'|'duplicate'|'stale'>`; `POST /billing/webhook/:provider` consumes raw signed body through `BillingProvider.verify`. A development-only local fixture adapter is explicitly disabled outside test/development; it is never a production bypass or public grant route.

- [ ] Assert bad signatures/forged user IDs cannot grant access; entitlement identity must match a server-owned subscription/customer binding, never arbitrary event metadata. Duplicate event is applied once; older versions cannot overwrite newer state; trial/active/cancelled/expired states preserve history. Race subscription expiry with mock completion and prove its review remains available.
- [ ] Run billing integration tests; confirm failures before implementation.
- [ ] Implement transactional receipts and versioned entitlement updates; cancelled subscriptions retain access until their recorded end date. Serve price/term configuration separately from entitlement logic. Keep live checkout disabled until owner chooses prices, tax/refund terms, cycle validity, multi-exam scope and a merchant/payment provider. Once selected, add its official sandbox adapter and signature/event fixtures before real activation; local fixture success is not payment-provider verification.
- [ ] Run billing and access suites. Document exactly which merchant sandbox/live checks remain blocked by operational choices; the core platform can continue locally.

### Task 13: Grounded AI service and evaluation harness

**Files:** `packages/server/src/ai.ts`; AI provider port; AI contracts; reservation/conversation migrations; `tests/integration/ai.test.ts`; `tests/ai-evals/cases.json`; evaluation runner; `docs/implementation/rules.md`.

**Interfaces:** `buildContext(actor:VerifiedActor,request:AiRequest):Promise<GroundedContext>`; `askGuide(actor:VerifiedActor,request:AiRequest):Promise<AiReply>`; `reserveAi(actor,requestId):Promise<Reservation>`; `completeAi(reservation,usage,outcome):Promise<void>`. Reservation is unique per user/request, consumes one provisional allowance atomically, settles success once and releases failed/unavailable requests once. Use a 30-second provider timeout and 2-minute reservation lease; recover stale reservations transactionally on the next quota request. Retry of a completed request returns its stored reply, without another provider call/charge. `GET /ai/allowance`, `POST /ai/messages` expose remaining allowance and replies.

- [ ] Assert no context contains another student's records, unpublished content or active-test keys; tutor use during active assessed work is refused. Missing/conflicting factual sources return unsupported guidance; unrecognized citation IDs cannot become links. Two simultaneous requests with one unit remaining permit one provider call. Provider timeout returns unavailable and releases the reservation while preserving student work; a simulated worker crash recovers its expired lease exactly once and a completed-request retry returns its stored reply.
- [ ] Run AI integration tests against a deterministic fake provider and real transactional quota store; confirm failures.
- [ ] Implement retrieval from approved versioned content and relevant own evidence using indexed topic/source lookup first; avoid a vector service until retrieval evaluation requires it. Enforce prompt/input/output budgets, timeouts, rate limits, source-ID validation and redacted logs. Treat retrieved text as untrusted data, not tool instructions. No AI tools may write scores, targets, publications or billing. Persist assistance flags before providing relevant learning help.
- [ ] Build a fixed evaluation set covering all five modes, beginner misunderstandings, unsupported dates, disputed keys, prompt injection, assessment leakage and provider failure. Choose provider/model using current official API docs and observed accuracy, support, latency and cost; record exact configuration and budgets. Credentialed provider evaluations remain explicitly unrun until access is available, not replaced by fake-provider scores. Local rules/quota tests must pass regardless.

### Task 14: AI tutor, accepted plan proposals and mock-review UI

**Files:** Learner AI feature; plan/review/revision integrations; `packages/server/src/ai.ts`; `tests/integration/proposals.test.ts`; `tests/e2e/ai-guide.spec.ts`.

**Interfaces:** `acceptProposal(actor,id:Id,expectedPlanRevision:number):Promise<StudyPlan>`; `editProposal(actor,id:Id,items:PlanItem[]):Promise<PlanProposal>`; `POST /plan/proposals/:id/accept`, `PUT /plan/proposals/:id`. Proposal storage contains owner, base revision and acceptance status. AI may only propose known authorized activity IDs; validate references on acceptance.

- [ ] Assert a proposal never changes a plan until accepted, stale revision returns 409, invalid activity IDs fail, another learner cannot accept it and repeat acceptance creates one revision. Browser test exhausts allowance, simulates provider failure and confirms lessons, normal explanations, revision and mock review still work.
- [ ] Run proposal and AI browser tests; confirm failures.
- [ ] Implement contextual hints/direct explanations, source display, beginner discovery, revision help and completed-mock review. Explain remaining usage before requests and show clear retry/unsupported states. Ask students for reasoning before assigning an error cause. Preview/edit/accept plan changes explicitly. Prefer reviewed-bank practice; generated examples, if offered, carry generated labels and never enter official scores or strong progress evidence.
- [ ] Run suites and `npm run eval:ai`. Record real-provider and fake-provider results separately. Release AI only after sourced factual cases cite support, restricted-data/assessment cases have zero leaks, proposals require acceptance and observed per-interaction cost fits the chosen allowance; record any failing case rather than averaging away critical failures. Re-run affected evaluations on prompt, model, retrieval or tool-permission changes and retain the evaluated configuration version.

## Phase 4 — browser release readiness and future mobile handoff

### Task 15: Responsive, accessible and installable browser experience

**Files:** Learner/site styles and feature components; manifest/icons; `tests/e2e/accessibility.spec.ts`; `tests/e2e/responsive.spec.ts`; `docs/implementation/mobile-handoff.md`.

**Interfaces:** Preserve Task 1's independent learner build and platform adapter. Browser install entry uses the manifest; API origin and auth persistence are adapter configuration. Future Capacitor adapters may replace storage/deep linking without replacing learning screens or server APIs.

- [ ] Add focused browser assertions for keyboard navigation/focus, labelled questions and save state, screen-reader score/progress summaries, reduced motion, 360px-wide and desktop layouts. Reloading an authenticated screen restores its safe state; closing/reopening does not restart a mock. Assert manifest start URL opens the learner and icon paths resolve. Maintain the WCAG 2.2 AA requirement checklist across full learner flows, including accessible authentication and timing behavior; document and verify any essential-timing exception rather than assuming all timed activities are exempt.
- [ ] Run both browser files and confirm failing accessibility/layout cases.
- [ ] Fix usability and accessibility issues; add original simple icons and install metadata. Do not cache private assessment responses in a service worker. Document future Android/iOS work: packaged asset configuration, API/CORS allowlist, secure auth persistence, deep links, signing, device tests, store/payment policy review and releases. Do not install/build native targets now.
- [ ] Run files on the built site and manually inspect mobile/desktop screenshots plus keyboard and screen-reader flows. Note browser/device coverage actually exercised; no claim of untested native compatibility.

### Task 16: Full-path verification and honest handoff

**Files:** `tests/e2e/release.spec.ts`; `docs/implementation/release-checklist.md`; root run instructions and spec approval/status references.

**Interfaces:** Consume the preceding public API contracts and coverage/evaluation reports. Produce a release record distinguishing software checks, content coverage, AI-provider evaluation, merchant sandbox checks, operational blockers and user-authorized deployment steps.

- [ ] Write a release E2E that exercises each exam's public guide → saved target → optional diagnostic → lesson → independent practice → revision → timed mock → review → progress → updated plan. Repeat key flow with Explore, Prepare, expired access and unavailable AI. Assert source/version attribution and isolated account history throughout.
- [ ] Run the release test and preserve any failures before fixes; implement only the fixes belonging to this accepted scope.
- [ ] Run typecheck, lint, unit, integration, real database tests, build and release browser suite. Run content coverage checks for every marketed complete exam and real AI evaluation for an enabled AI feature. Re-run only affected tests after corrections, then the release gate as necessary.
- [ ] Complete separate software, educational/content and operational readiness records. Software includes applicable ASVS/browser/contract evidence; content includes official sources, reviewed coverage and dispute handling; operations includes environment isolation, cost limits, telemetry, backup/restore exercise and repair instructions. Initial local handoff may identify unrun hosted/provider checks as blockers; production readiness cannot mark them passed. Show the local product for review and distinguish complete paths from pilots. Do not deploy, provision services, charge, commit, push or build native apps. Obtain later operational authorization against this concrete reviewed result.

## Completion and dependency notes

- Tasks 1–7 deliver a usable local beginner/sample-learning path; they do not constitute complete commercial preparation.
- Tasks 8–11 supply assessed learning, retention and full-path content. Editorial volume is established by the source audit; it may dominate the delivery effort.
- Tasks 12–14 add commercial/AI infrastructure without making AI a core dependency. Real merchant/model services require their own verified adapters and configured access before they are called ready.
- Tasks 15–16 verify browser delivery. Android/iOS packaging remains a documented future project sharing the learner code and hosted backend.
- Do not claim full completion while content review, real database tests, enabled-provider evaluation or required commercial checks remain blocked.

## Planning references checked 23 October 2026

- [Vite production build](https://vite.dev/guide/build): independent static learner assets and relative base paths.
- [Next.js rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites): development proxy options; production learner assets are staged locally rather than requiring a second live server.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): database authorization and privileged-role caveats.
- [Supabase server-side authentication](https://supabase.com/docs/guides/auth/server-side): verify current client/server integration when implementing authentication.
- [Supabase changelog](https://supabase.com/changelog): checked Markdown feed; recent entries include a forthcoming legacy TLS cipher removal and deprecated framework adapters. Use supported SDK paths and modern HTTPS; recheck breaking changes at implementation time.
- `docs/research/2026-10-17-cross-platform-strategy.md`: accepted architecture and separate future native delivery work.

## Self-review record

Reviewed against design sections 1–14: discovery/onboarding (6), teaching/planning (7), tests/review/progress (8–9), revision/current affairs (10), content publication/completeness (2–3, 11), access/commerce (5, 12), all AI modes and resilience (13–14), shared browser/mobile boundary (1, 15), release evidence (16). All five Review Focus conditions have tests in their owning tasks. Shared DTOs, route names and service ownership are defined above; provider and merchant choices are bounded evaluation/activation steps rather than invented approvals. No implementation, test execution, content validation or publication is claimed by this plan.
