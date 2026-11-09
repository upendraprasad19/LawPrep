# Law Prep completion board

Checked 6 November 2026 against the approved platform design/implementation plan, current source tree and saved review/load evidence. This is a consolidated status inventory, not a replacement design or authorisation for new hosted operations.

9 November update. Access, CLAT setup and the first sample are backed by the development database. A temporary learner verified the signed-in save and resume flow across two real Auth sessions. A follow-up migration for conflicting saves remains pending. See the [CLAT sample task board](clat-sample-task-board.md).

## Current baseline

- Engineering checklist, typed API boundary, independently buildable learner shell and local verification tooling exist. CI files are prepared; remote enforcement is not configured.
- Sign-in, owner enrolment, account/profile and owner publishing/import screens exist. Real owner authentication, intake access and the first authenticated draft-load round trip were verified. Broader multi-account/provider/Storage/concurrency acceptance remains open.
- One sealed private intake contains 1,313 original records: 1,203 questions, 41 lessons, 65 curriculum entries and four deck containers. Those are inventory counts, not usable-course totals.
- First-pass review covers the original collection. Original 492 missing-item proposals have independent assessments: 364 reasoning accepts, 48 confirmed blockers, 41 evidence-pending and 39 clarification-required. Separate adapted versions overlap those originals; these totals do not establish publication clearance.
- Eleven newly written lessons with 23 worked examples are saved as private canonical drafts. One CLAT foundation cycle and eleven topics are published metadata. No lesson catalogue entries or content publication. Fourteen selected practice candidates remain outside the hosted load; five other lesson revisions retain evidence limitations.
- The learner app includes account and editor workflows, CLAT setup and a local sample lesson with practice. The full planner, mock, progress and AI features remain open.

## Remaining work

| ID | Area | Current state | Required completion |
| --- | --- | --- | --- |
| CP01 | Account/catalogue/provider closeout | Existing account flow with two-account profile and session checks in isolated PostgreSQL | Finish real provider isolation and revocation, cross-device persistence, redirect/recovery/email delivery, Storage boundaries and concurrency. |
| CP02 | Free/paid/sample access | Cycle grants and account access view implemented. Hosted read and Explore access verified for a signed-in learner. | Extend access checks to catalogue lessons, practice and attempts, then connect billing and AI allowance. |
| CP03 | Beginner website and exam guides | CLAT 2027 starter guide with official syllabus and eligibility links | Expand career and degree guidance and add verified Patna BLET and CUET-PG LLB guides and comparisons. |
| CP04 | Learner onboarding | CLAT setup saves preferences in the development database. Both diagnostic paths lead to the sample lesson. | Verify conflict handling after the follow-up migration, add secondary exam paths and connect setup to the full study planner. |
| CP05 | Student lesson reader | Local sample teaches reading comprehension through an objective, a worked example and a suggested next step. | Extend the reader to authorised catalogue lessons with prerequisites, worked steps, notes and resumable activities. Verify real provider delivery. |
| CP06 | Guided study planner | Not implemented | Deterministic daily plan using available minutes, prerequisite order, due revision and weak evidence; allow browsing/skipping, missed-day adjustment and unknown exam dates. Persist revisions; work fully without AI. |
| CP07 | Practice engine | The sample grades two original questions on the server and restores reading and feedback across sign-ins. | Verify hosted conflict handling after the follow-up migration. Extend delivery to guided and independent topic practice with hints and assistance tracking. |
| CP08 | Tests and mocks | Not implemented | Topic/section/full mocks from verified blueprints; server-owned deadlines/marking, saved answers, reconnect/resume, conflict handling, submission/expiry and frozen version/key snapshots. Results and section review must reproduce past attempts after corrections. |
| CP09 | Progress and mistake review | Not implemented | Pending/in-progress/covered topic tracking; separate coverage, assisted/repeated/fresh performance and later retention; weak-area priorities, dates/evidence counts, insufficient-data states and useful completed-test review. No invented percentile or readiness guarantee. |
| CP10 | Revision, notes and current affairs | Not implemented | Saved notes, flashcards plus application questions, spaced review queues, overdue handling and policy/versioned scheduling. Dated/source-linked current affairs and relevant exam/archive mappings follow the same editorial workflow. |
| CP11 | Complete preparation content | Major editorial work remains | Resolve evidence/clarification/blocked items; keep withdrawn/unusable items out of scoring; repair remaining lessons and explanations; produce missing teaching, distinct practice families, revision and assessment pools; verify official paper/year/final-key identity and exact reuse basis. Complete per-exam coverage checks; no inference of completeness from1,313 rows or11 lessons. |
| CP12 | Owner publishing and student reports | Publisher foundation exists | Close real review/publish/correct/withdraw acceptance, source/PDF asset handling if used, coverage/gap dashboard and student issue reports with owner triage. Reports cannot directly change keys; corrections preserve historical attempts and audit. Owner editorial publication remains a separate decision. |
| CP13 | Billing and access lifecycle | Not implemented | Test-mode/sandbox checkout adapter and signature-verified idempotent payment events; activation/expiry/cancellation/refund handling; price/terms configuration. Owner chooses provider/prices/validity/multi-exam/tax/refund terms before live enablement. |
| CP14 | Optional AI guide | Not implemented | Grounded backend and UI for discovery, learning hints/explanation, accepted plan proposals, revision and completed-mock review. Retrieve approved sources and own permitted evidence only; enforce citations, private data isolation, active-assessment restrictions, assistance flags, allowance/quota/timeout/crash recovery and redacted logs. Real model evaluations and measured cost/quality required before enabling; core preparation works without AI. |
| CP15 | Browser/mobile usability | Shell only | Full navigation and responsive layouts, loading/empty/error/conflict states, keyboard/focus/screen-reader/contrast/reduced-motion/touch checks across all new flows. Add home-screen manifest/icons after core flow works; no offline or native-store claim. |
| CP16 | End-to-end acceptance and operations | Not complete | Full beginner→target→lesson→practice→revision→mock→review→progress→updated plan for each supported route and access state. Run relevant unit/HTTP/real DB/browser/build/security/accessibility/AI/content checks and independent reviews. Verify reset/replay, backups/restore, monitoring, redacted telemetry, rate/cost limits, data retention/deletion/privacy/terms, dev/production isolation and operator/runbook procedures. |
| CP17 | Hosted release and handoff | Not authorised or performed | Prepare deployable artifacts and handoff. Finalise hosting/domain/production email/configuration and commercial plan suitability, secret handling, CI/rulesets/preview isolation/manual promotion. Commit/push/configuration/deployment/live payments/native builds retain explicit authority boundaries. Local success is not remote enforcement or a live launch. |

## Specific content holds that must stay visible

- Fourteen selected legacy practice candidates need a verified origin/reuse basis before a hosted load/publication.
- Five qualified lesson revisions (grammar and four legal foundations) still have evidence limitations; remaining original teaching findings are not all resolved.
- The original missing-item ledger retains48 confirmed blockers,41 evidence holds and39 clarification holds. The original24 null explanations (20 blocked/four withdrawal dispositions), separate adapted repairs and these categories overlap; do not add them as independent unresolved question totals.
- The two first-batch practice gaps are dedicated necessary-assumption practice and fresh practice for the reasoning routine. Worked examples/reused questions are not a substitute for new independent assessment evidence.
- q794 remains excluded pending a readable primary passage. Official-key/paper mapping, revised keys, permission/reuse, duplicate/passage-family and exam-fit checks remain item-specific.
- Patna BLET official scope/configuration must be verified independently; Panjab material is not proof of Patna exam coverage. CUET route/institution/cycle mappings also need exact sources.
- New question-bank candidates remain a discovery list, not imported or cleared content. Private PDF/source upload is separate from existing structured intake.

## Work that can proceed without owner review between routine steps

Continue the accepted local software plan in dependency order: account/access closeout → guides/onboarding → complete lesson/practice/planner sample → mocks/progress/revision → editorial coverage/reporting → test-mode billing and optional AI → browser polish and final acceptance. Use checked local fixtures when genuinely unavailable providers/content prevent verification; label those limits and never present fixture results as provider/content acceptance. One subagent at a time at most, used for bounded independent milestone reviews.

Code, local tests, documentation, source research, content proposals, defect repairs and concrete review packages can proceed within the approved scope. New hosted schema/data/publication operations need their own concrete applicable authorisation; preserve the existing approved load and original intake.

## External/owner-dependent completion gates

- Exact source ownership/reuse permissions where not established; official documents or exam mappings that cannot be obtained. Do not contact publishers or purchase access without instruction.
- Final content/publication and marketed-course completeness approval. A user review is not a blanket third-party copyright licence.
- Provider/model account access and a controlled AI budget for real evaluations; credentials through secure configuration, never chat.
- Merchant/account choice, sandbox access, real pricing and commercial/legal terms; live charging remains off until authorised.
- Production hosting/domain/email configuration, operational accounts and final release/commit/push/deployment approval.

These gates do not prevent building/reviewing the local product, but prevent an honest claim of full live commercial readiness until resolved.

## Deferred, outside current completion

Native Android/iOS packaging/store submission; offline assessed tests/download replication; push notifications; video/live classes/human mentorship; additional languages/social network/large gamification; admissions submission/job placement/rank prediction. English online-first web delivery remains the agreed target.

## Sources of truth

- [Approved implementation plan](../superpowers/plans/2026-10-23-law-prep-platform-implementation.md)
- [Approved product design](../superpowers/specs/2026-10-16-law-prep-platform-design.md)
- [Content review task board](../research/content-review-task-board.md)
- [Verified first private lesson load](../engineering/reviews/first-clat-private-load.md)
- [Engineering checklist](../engineering/coding-checklist.md)

This inventory did not run a new whole-product acceptance suite, re-query hosted state or make a hosted/content/code change. It checks current files and the freshly completed6November hosted-load evidence, and does not translate older unchecked plan boxes into claims that already implemented auth/editor functionality is absent.
