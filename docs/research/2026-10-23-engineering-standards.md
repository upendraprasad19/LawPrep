# Industry engineering practices adapted for Law Prep

Research date: 23 October 2026.

Status: working engineering baseline accepted by the owner on 24 October 2026. The owner accepted the proposed baseline, including security/accessibility targets, proportional review and separate software/content/operational readiness. This records the agreed process, not completed verification or authorization to provision, publish, deploy, spend, commit, push or build native apps. Execution-method selection remains pending.

## Conclusion

Use a small-team delivery process grounded in published engineering practices and recognized verification standards. Keep the core application modular, integrate small reviewed changes, automate reproducible checks, protect critical data contracts, and verify student-facing behavior. Apply additional review to consequences such as account isolation, scoring and purchases. An extensive custom policy engine or a large collection of scripts is not a prerequisite for starting the product.

There is no single universal industry process. The sources below include research-backed delivery guidance, published practices of actual engineering organizations, technical standards, and learning-platform examples. A recommendation for Law Prep is an adaptation, not evidence that every education company follows it or that particular CLAT competitors use it internally.

## Sources and decisions they inform

| Evidence | What the source establishes | Recommended adaptation |
| --- | --- | --- |
| [DORA: small batches](https://dora.dev/capabilities/working-in-small-batches/) and [continuous integration](https://dora.dev/capabilities/continuous-integration/) | Frequent integration and fast feedback are important delivery capabilities; large AI-generated changes are difficult to review. | Short-lived branches/worktrees and small, usable increments. Respect the owner's explicit commit/push authorization; do not turn a research recommendation for frequent integration into permission to push. |
| [Google: small changes](https://google.github.io/eng-practices/review/developer/small-cls.html) | Focused changes are easier to review and reason about; related tests belong with the change. | One coherent behavior per reviewable change. Separate substantial refactors from feature changes. No arbitrary universal line-count limit. |
| [Google: testing feedback loops](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html) | Depending mainly on end-to-end tests makes diagnosis slower and failures harder to isolate. | Fast domain/unit tests, real database/API integration tests, and a focused browser suite. Choose layers by the failure being tested; do not impose a percentage ratio. |
| [NIST SSDF, SP 800-218 v1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Security belongs throughout the development lifecycle, including prevention and response to vulnerabilities. | A compact secure-development checklist with accountable ownership, dependency handling, release evidence and incident response. This is alignment, not a certification claim. |
| [OWASP ASVS 5.0.0](https://asvs.owasp.org/) | Versioned, testable security requirements for web applications and services. | Map applicable requirements to authentication, authorization, validation, sessions, files, API/data protection and logging tests. Track each applicable requirement as verified, failed, blocked or justified not applicable. Avoid claiming a whole ASVS level until its full applicable scope is assessed. |
| [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use) | Workflow permissions, untrusted inputs and third-party actions are security boundaries; full commit-SHA pinning mitigates mutable action references. | Least-privilege CI, verified pinned action revisions, safe secret handling and no privileged execution of untrusted pull-request code. |
| [GitLab: avoiding migration downtime](https://docs.gitlab.com/development/database/avoiding_downtime_in_migrations/) | Destructive schema changes may require staged application/schema transitions and cannot be assumed reversible. | Backward-compatible migrations, tested data transformations, restore preparation and forward repair when needed. Do not copy GitLab/Rails-specific release steps literally. |
| [Google SRE: service objectives](https://sre.google/workbook/implementing-slos/) | Reliability objectives guide prioritization using observable service outcomes. | Observe successful answer saves, completed submissions, recovery and latency. Select realistic targets after measurement; do not promise a paid-service availability guarantee on unverified free hosting. |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Testable accessibility criteria and conformance conditions across full pages and workflows. | Target Level AA for the learner journey, with keyboard/screen-reader/manual checks as well as automation. Review timing and authentication behavior, not only colors. No conformance claim from an automated scan alone. |
| [Moodle question banks](https://docs.moodle.org/en/Question_bank) | A mature LMS separates Draft and Ready questions and supports specific question versions within quizzes. | Reviewed question status, versioned content and frozen assessment snapshots. This is a useful implementation precedent, not proof of our future scoring correctness. |
| [Moodle quiz statistics](https://docs.moodle.org/en/Quiz_statistics_report) | Question statistics help inspect assessment quality and identify problematic questions. | Capture errors/disputes and review question quality; analyze item behavior when sufficient representative attempts exist. Do not invent calibrated difficulty, percentiles or readiness from sparse/repeated/assisted data. |
| [NIST GenAI profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), [OWASP prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) and [excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) | AI systems require risk evaluation; prompts/retrieved content can be manipulated and overbroad tool permissions amplify harm. | Version prompts/model/retrieval settings, evaluate sourced guidance and student-data isolation, constrain tools and treat outputs as untrusted. AI may propose plans, never authorize privileged writes or replace score calculations. |
| [1EdTech QTI](https://www.1edtech.org/standards/qti) | A recognized format for exchanging question/test content between systems. | Retain portable IDs, metadata and exportable data. Full QTI import/export/certification is a possible future integration requirement, not a first-release prerequisite or implied scope commitment. |

The earlier AVYA and Ecosystem review adds project-specific lessons on semantic writer/reader drift, cache identity, canonical read projections and proof that gates actually execute. The established sources above support the broader process; they do not independently validate our reference repos or their historical numeric claims.

## Recommended working process

### Before a change

Write a small acceptance example and identify the data/security boundary involved. For a critical feature, include misuse cases: anonymous access, user A requesting B's record, an expired session, forged ownership, replayed requests, conflicting devices and an unavailable dependency. Use a one-page threat model for the main system and revisit it when boundaries change. This is a proposed local practice, not a claim that ASVS mandates a particular document length.

Keep the source-of-truth registry restricted to important concepts: exam configuration, published content, answer keys, attempts, evidence, plans, access and AI quota/context. Reuse the shared typed contracts. Do not require a separate registry entry for every button or harmless utility.

### During development

Develop one usable behavior at a time. Begin meaningful behavior changes with a failing test/example, then implement and verify it. TDD is our chosen technique where useful, not a universal industry obligation. Prefer behavior tests over source text checks and narrow mocks that omit the real boundary. Required data-access protections need real database tests.

Run focused checks during iteration; run applicable full integration/build/security checks before accepting the change. Keep formatter/linter/compiler work out of reviewer's time. An automatic retry must not conceal a persistent test defect; record and fix flaky tests instead of excluding critical cases to obtain green results.

### Review and integration

Use the existing proposed low/normal/high risk tiers. Low-risk copy/style work needs focused visual/accessibility checks and self-review. Normal product behavior receives one independent code review. High-risk boundaries receive an independent plan/security assessment before implementation and review of the resulting behavior afterward. A review can cover a coherent group of closely related tasks; avoid mandatory repeated blind reviews for all edits.

An AI reviewer is a useful additional perspective, not proof of independent human approval or a replacement for security/domain expertise. It can share the implementer's blind spots. Tie findings to the actual reviewed code/diff and close them with test evidence. A code/content/operational blocker cannot be cleared by merely adding an unchecked statement to a ledger.

Use pull requests and required checks when authorized to push. Keep main usable and reject changes whose applicable required checks failed, were cancelled or never ran. Production promotion stays explicitly authorized even if staging deployment is automated. Continuous delivery means being able to release safely on demand; it need not mean unapproved automatic publication.

### Release and operation

Exercise the built staging app through a real student journey. Promote the verified commit/artifact and identify the matching schema/config/content versions. Confirm the hosting configuration cannot turn an ordinary branch push into an unintended production release. Keep rollout/rollback instructions appropriate to the selected host, including database compatibility.

Before production reliance, measure backups and perform a restore exercise, test error visibility and account recovery, and specify who responds to broken saves, scoring errors and content disputes. Use a small operational dashboard; observe actual unsuccessful writes/submissions and provider failures, not just page views or server CPU. Dependency vulnerabilities and incidents get triage, reproduction, remediation and regression proof.

## Separate acceptance tracks

All three tracks must be clear; a pass in one does not imply a pass in the others.

### Software readiness

- Identity/ownership enforced server-side and by actual row-policy tests.
- Scoring/deadlines, attempt snapshots and concurrency behavior verified.
- Relevant browser flows, accessible interaction and mobile layouts checked.
- Build, security, migration/type and contract checks passed on the accepted change.

### Educational/content readiness

- Current exam route/syllabus/marking facts have dated official sources.
- Published lessons/questions/explanations have editorial review and permitted sources.
- Each marketed exam has the required teaching, fresh practice, revision and mock coverage.
- Assistance/exposure/retention evidence remains separate; completion does not imply mastery.
- Students have a clear way to flag disputed material for editorial handling; this is a proposed launch acceptance addition, not an already implemented feature.
- Corrections preserve historical assessments and show the applicable content/key version.

### Operational readiness

- Environment, secret and preview/production isolation actually verified.
- Restore, failure monitoring, recovery and release repair are exercised.
- Email/support identities, privacy/retention/account handling and commercial terms are ready for the intended audience.
- Provider costs and plan limitations are visible, including AI allowance and hosting constraints.
- Enabled AI/payment integrations have real-provider/sandbox evidence; fixture-only tests are labelled accordingly.

For AI specifically, maintain a fixed set of sourced tutoring, planning, mock-review, revision and beginner-guidance cases. Re-run affected evaluations when the model, prompt, retrieval or tool permissions change. Include missing sources, conflicting keys, malicious retrieved text, another student's records, active-assessment leakage and provider timeout. Security failures block release even if an aggregate answer-quality score looks high. Evaluate usefulness on fresh independent work rather than treating conversation length as learning.

## What to keep lean

The initial implementation should use standard TypeScript/lint/test/CI capabilities, one short root rule file, a small contract registry and a single verification entry point. The proposed `scripts/verify.mjs`/`quality-gates.json` should be thin command orchestration and evidence reporting, not a new general-purpose workflow engine. Add custom detection only where standard tools/tests cannot reliably guard a clear failure class.

Proposed adaptations from the earlier process documents:

1. Keep high-consequence writer/reader semantics documented and behavior-tested; reduce exhaustive low-value registries and fragile source-line assertions.
2. Keep review proportional and avoid reviewing compiler errors that standard tools already detect.
3. Keep independent review of high-risk boundaries during development rather than waiting only for the final whole-product review.
4. Keep release gating honest while avoiding repeated expensive full-suite/provider evaluations on unrelated copy edits.
5. Target WCAG 2.2 AA, add an applicable ASVS requirement map and a concise threat model; do not claim certification or completed conformance from adopting their vocabulary.
6. Add the accepted content-dispute handling and review evidence to the editorial acceptance track; implement during the authorized execution phase.
7. Track simple reliability and process outcomes: failed saves/submissions, recovery time, recurrent bug classes, review delay and CI duration. Use measurements to improve the process rather than maximize the number of gates.

Formal ISO/SOC assessments, full QTI/LTI interoperability, elaborate mutation-testing infrastructure, microservices, Redis and a large process automation platform are not prerequisites proposed for this initial consumer product. Revisit particular capabilities when actual customers, risk, scale or integration requirements justify them. This is a recommendation for discussion, not an irreversible removal from future scope.

## Concrete example: accepting an answer autosave change

Acceptance starts with the student's need: an answer shown as saved must remain saved after refresh and on another signed-in device. The change includes the writer/API schema, revision/idempotency constraint, answer-resume reader, pending/saved/conflict UI and telemetry.

Tests cover refresh, two simultaneous devices, duplicate save, expired deadline, A/B ownership, temporary network failure and a late old-session response. The reviewer checks the mechanism and actual test evidence. Staging verification exercises the built flow; a release record identifies the exact accepted version. If a previously confirmed save disappears, incident handling prioritizes data integrity and repair over adding unrelated features.

This illustrates the proposed standard: identify the consequence, keep the change reviewable, verify the real contract, and preserve a recovery path.

## Next discussion

The owner accepted this working baseline on 24 October 2026. Incorporate it into the implementation tasks now and create the active root rules/gates during the authorized execution phase. Do not ask again for approval of the same engineering baseline. No accounts, resources, deployment, product code, commit or push was performed for this research.
