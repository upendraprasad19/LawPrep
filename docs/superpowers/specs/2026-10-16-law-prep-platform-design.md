# Law Prep — product design

Date: 16 October 2026

Updated: 24 October 2026

Status: Full consolidated design approved by the owner on 23 October 2026. Local implementation authorized on 24 October: engineering foundation, browser/API foundation and draft source inventory accepted with independent reviews. Authentication/database integration, complete reviewed content and production release remain pending. The beginner journey mockup direction and web-first architecture were accepted earlier.

Repository: https://github.com/upendraprasad19/LawPrep

## 1. Intent

Law Prep is a one-stop, English-language, self-paced preparation platform for Indian law entrance exams. It helps a complete beginner understand law careers and degree routes, choose suitable target exams, learn the required material, practise, revise, take mocks and understand progress.

CLAT is the main product focus. Upendra will personally prepare for BLET, providing a concrete use case for meaningful support beyond CLAT. CUET-PG LLB remains within the discussed exam scope. No secondary exam has been approved for removal or deferral.

The intended routes, as established by the existing research and prototype, are:

- CLAT UG: admission preparation for five-year integrated undergraduate law programmes. CLAT PG/LLM preparation is not part of this design.
- BLET: the Patna University entrance route for the three-year LLB at Patna Law College, not Panjab University's LLB entrance. Panjab papers in the folder are analogue practice material, not authentic BLET papers.
- CUET-PG LLB: the graduate-entry, three-year LLB preparation track identified as COQP11 in the supplied research, including the DU/BHU targets discussed there. This does not mean CLAT PG or an LLM preparation course. Reconfirm the applicable paper code and each institution's admission mapping for the target cycle before publishing guidance or configuring scored tests.

The initial product is a responsive web app, sharing the student's account, content access and progress across desktop and mobile browsers. The owner explicitly chose web-first delivery and deferred APK/iOS builds. Home-screen installation is a progressive enhancement, not a separate native codebase or a promise of offline features.

The product should answer three recurring questions: What should I do next? Why is that appropriate for me? What evidence shows that I am improving?

## 2. Decisions confirmed by the owner

- Build for Upendra and other students, including complete beginners.
- Provide a complete preparation experience within the platform.
- Explain law careers, the exams and how to begin before directing a newcomer into preparation.
- Make CLAT the main product focus; support Upendra's BLET preparation meaningfully.
- Deliver learning material in English at launch.
- Use plain explanations, worked examples, guided practice, independent practice, explanatory feedback and spaced revision.
- Defer video teaching, live classes and human mentorship for now.
- Offer complete preparation with an optional paid personal AI study guide.
- Use three commercial tiers: free Explore, paid Prepare and an optional paid AI Guide upgrade. Exact prices remain open.
- Follow the accepted beginner mockup's general flow and calm navy/amber visual direction.
- Build a web app initially; defer APK and iOS builds.
- Use a shared React/TypeScript learner application, Next.js for the public website and hosted web functions, shared backend services, and Capacitor as the planned route for later Android/iOS packaging. Platform-specific additions and separate releases will still be required.
- Do not commit or push without an explicit instruction. Existing files are to be preserved.

The owner approved this consolidated design on 23 October 2026. Builder defaults and recommendations below are part of that planning baseline; explicitly unresolved prices and commercial activation choices remain open.

## 3. What exists

The workspace is not currently a Git checkout. The GitHub main branch inspected during this conversation contained only README.md at commit `81b9a3ffa8eb4d480918a8303a8b11d2c445ab42`. Recheck before integrating implementation work.

`LexCommand.html` contains 1,203 question records, 41 BANK lesson records and 65 curriculum entries. There are 13 PDFs in Past_Papers. Sixty-five question records carry a verification flag. These are extracted inventory counts, not evidence of correctness, publication rights or complete syllabus coverage. The current HTML stores progress locally in the browser.

The July 2026 design and implementation plan are historical input. This October design takes precedence for product scope where they disagree. The July technology versions, database schema, completion checkboxes and research claims are not automatically current implementation requirements.

Accepted concept: `.superpowers/brainstorm/1813-1792164911/content/beginner-journey-v2.html`.

The concept is a throwaway demonstration, with sample content, temporary in-memory state, scripted AI and no accounts or billing. See `docs/design-previews/beginner-journey-notes.md` for its verification and limitations.

## 4. Goals and success criteria

- A newcomer can explain their selected degree/exam route and understand where to start.
- A student can follow a complete exam-specific learning path without needing a separate coaching course to fill planned curriculum gaps.
- A student can distinguish completed reading from demonstrated understanding and later retention.
- A test produces actionable feedback linked to lessons and further practice.
- The website and app present consistent access and progress.
- AI helps students reason and improve on fresh, unaided questions; assistant usage alone is not a success metric.

Prototype usability checks should ask students to choose an exam, locate their next activity, finish a lesson, review a mistake and identify a topic needing attention. Product evaluation should separately track useful activity, completion, retention checks, independent performance, paid conversion and operating cost.

## 5. Scope boundaries

### Included

Career and exam discovery; target selection; optional starting assessment; structured lessons; notes; practice; topic/section tests; full mocks; mistake review; current affairs; revision; progress; cross-device accounts; content publishing; plan access and optional AI guidance.

Shared content may serve several exams, but each exam requires its own verified syllabus mapping, preparation sequence, question selection and test configuration. An exam label alone does not constitute support.

### Deferred by the owner

Video teaching, live classes and human mentorship. These are deferred delivery modes, not permanently forbidden future features.

### Additional exclusions recommended for the first implementation

Application submission on a student's behalf, admissions processing, a social network, national rank prediction, job placement and a marketplace. Career and exam guidance remain included. New languages and a large gamification system are outside the current agreed scope.

The product must not imply guaranteed admission, infer mastery from a single correct question, invent a national percentile from its own small cohort, or advertise generated questions as actual past papers.

## 6. Main student journey

### Discover

Allow public exploration of law careers, degree routes and exam introductions before account creation. Guides explain terms, realistic trade-offs, further qualification steps where relevant and the difference between entrance routes. Factual requirements link to dated official sources. Eligibility is presented as sourced guidance, with uncertainty explicit where information is missing.

The accepted mockup demonstrates career categories; it does not establish a final exhaustive career taxonomy or exam requirements.

### Choose a path

Ask for the primary exam, optional secondary exams, intended attempt, available study time and starting familiarity. Education information helps explain relevant routes; avoid collecting documents or sensitive eligibility evidence for this preparation product.

Students may defer choices and change targets later. Account creation is required to save progress across devices, not to browse introductory guides.

### Establish a starting point

Offer a short, low-pressure diagnostic appropriate to the chosen exam. The student can skip it and begin foundations. Keep diagnostic questions separate from subsequent independent checks. Describe limited evidence honestly; do not attach a strong skill label to one answer.

### Follow a plan

Provide a sequenced curriculum and a manageable daily/weekly plan using target exam, study availability, prerequisite coverage, performance evidence and revision due. Display a short reason for important recommendations.

The standard Prepare plan uses recorded learning data and explicit scheduling rules. Optional AI can explain or propose more personalised changes. Students can browse freely, skip a recommendation or change availability. A missed day leads to a realistic replan rather than an ever-growing compulsory backlog.

If a target date is unknown, provide a foundation routine without fabricated countdowns or completion promises. Changing exams preserves history and reinterprets relevant shared learning; it does not erase unrelated progress.

### Learn and practise

Each teaching unit has a clear objective, prerequisite terms, a plain explanation, a worked example, supported practice, independent practice, corrective explanations and a later review link. Use diagrams, tables and annotated passages where they explain the material.

Show hints when needed, then stronger explanations or a full worked solution when appropriate. Mark assisted and repeated practice distinctly from fresh independent evidence. Avoid forcing an endless hint conversation when the learner needs a direct explanation.

### Test and review

Offer topic tests, sectional tests, tagged past papers and full mocks. Exam configuration belongs to a versioned exam cycle and official source, including duration, question structure, marks, penalties and accommodations when relevant. Do not hard-code July prototype patterns as current facts.

Freeze the question/answer-key version for an attempt. Save responses safely and support reconnecting to an in-progress session. A full mock uses a server-authoritative deadline; a device refresh does not restart the timer. Standard explanations and score reports are included in Prepare.

After submission, show scoring, section/topic evidence, timing and reviewable answers. Allow the student to classify mistakes and record reasoning. Connect errors to relevant units, targeted practice and a later check. AI analysis is optional.

### Revise

Offer concise notes, flashcards and practice-based recall. Schedule revisits using recorded performance and elapsed time. Exact scheduling formulas are a builder choice that must be documented, configurable and testable. Separate recall of facts from applying ideas to fresh passages or cases.

Current affairs follow a dated publication and revision workflow, with source attribution and correction history.

## 7. Progress model

Track these dimensions independently:

| Dimension | Evidence |
| --- | --- |
| Coverage | A lesson/topic was completed or explicitly marked studied |
| Practice | Attempts, correctness, question types, assistance and exposure history |
| Understanding | Performance across sufficiently varied independent checks |
| Retention | Successful later checks, with date and evidence |
| Exam performance | Scores, accuracy, time and attempt strategy on identified tests |

Topics can be pending, in progress or covered while also requiring more practice or revision. Explain skill labels and show insufficient evidence explicitly. The builder may choose initial conservative thresholds; they are product estimates to evaluate, not scientifically validated exam-readiness scores.

Store the underlying attempts, not just a single mutable mastery number. A student should be able to see why a topic needs attention. Preserve earned progress if paid access expires, while applying content access rules.

## 8. Optional AI Guide

The desired AI journey includes beginner guidance, contextual tutoring, study planning, mock analysis and revision. Recommended delivery order is tutor, planner and mock-review guide, with the broader capabilities developed around the same student context. This order is a proposal, not a deferral of the owner's platform goals.

### Context and operation

Use the student's selected exam, attempt, available time, relevant lesson, approved question/explanation, recent attempts, assistance history and revision state. Retrieve only relevant content and the student's own records. Use normal application code to calculate scores, entitlements, timing and progress evidence; AI explains these records rather than creating substitute facts.

The guide can simplify a passage, give another example, probe a student's reasoning, suggest practice, propose a schedule change and walk through a mock. New plan changes are presented for the student to accept or edit. AI cannot silently change exam targets, publish content, alter billing or override a verified answer key.

Answers about eligibility, dates, legal facts and current affairs must cite approved, dated supporting sources. If support is absent or conflicts, acknowledge it and offer relevant sources or flag the content. Grounding reduces errors but does not guarantee correctness.

Use hints and learning checks thoughtfully. Evaluate usefulness on subsequent unaided work, explanation accuracy, appropriate source support and whether the student can continue. AI conversations alone cannot establish mastery or a psychological diagnosis of why a student erred. Invite the student's explanation before attributing causes.

Generated practice is labelled separately from reviewed questions and past papers. Unreviewed generated items do not contribute to official mock scores or strong mastery claims. The initial release can select targeted practice from the reviewed bank rather than automatically generating exam-grade questions.

### Access and resilience

Enforce subscription and usage allowance on the server. Explain the allowance in student-facing terms and show remaining usage before starting a charged interaction. Account-level quotas work across web and app. Provider/model choice, budget routing, retrieval implementation and exact allowance are builder decisions pending cost and quality evaluation.

If AI is unavailable or an allowance ends, learning, standard explanations, existing plans, tests and progress continue according to Prepare access. Never interrupt a running mock with an upsell or an AI dependency. Protect conversations and student records with account-level access controls; do not expose one student's data to another.

## 9. Commercial structure

| Tier | Included experience |
| --- | --- |
| Explore — free | Career/exam guides, syllabus overview, starting assessment, a complete sample learning unit, sample mock and saved progress |
| Prepare — paid | Complete self-paced curriculum, practice, current affairs, revision, full mock programme, standard explanations and progress |
| AI Guide — optional paid upgrade | Interactive tutoring, personal planning, conversational mock review and guided revision |

The three-tier structure is confirmed. Exact prices are not. Suggested price ranges discussed in chat were hypotheses, not commitments or proven unit economics.

Recommended packaging: Prepare access through a clearly stated target exam cycle, AI as a monthly upgrade with a visible allowance and a bundle option. These commercial mechanics need final approval before enabling real billing. For planning, treat AI Guide as an upgrade to active Prepare; Explore may offer a bounded demonstration or trial without granting the entire curriculum.

The builder must centralise entitlements across website and app and support trial, active, expired and cancelled states, idempotent payment events and a test mode. Selecting a tier in the mockup does not count as a purchase. No live payment or publication is authorised by approval of this design alone.

Expiry prevents starting restricted content while preserving history. A mock started with valid access may finish and receive its standard review. Price, tax display, cancellation/refund terms, multi-exam access and actual billing enablement must be decided before commercial release; implement configurable entitlements without charging during development.

## 10. Content and publishing

Begin with an inventory and coverage matrix by exam, section, skill/topic and exam cycle. Reuse existing source material only after checking quality and permitted use. Keep original source records and imports intact; migrate through auditable, repeatable transformations rather than overwriting the HTML source.

For every question, retain source type, paper/year where applicable, exam mapping, passage grouping, answer/explanation, review status, version and applicable dates. Preserve withdrawn or disputed questions in historical attempts without silently changing past scores. A correction may produce an explicitly labelled recalculation when appropriate.

Recommended workflow: draft/import -> review -> published -> corrected/withdrawn. AI can assist drafting and tagging, but a named content publisher is accountable for publication. This editorial role is distinct from the deferred human mentorship service. Initially the project owner controls publication; staffing and production throughput can be planned separately.

Only reviewed, published content is offered as authoritative learning material or scored mock content. Flagged questions require a substantive check rather than simply clearing a boolean. Original-paper labels, answer keys and distribution rights must be verified before sale/publication. A lack of verified content is a content-production gap, not a reason to publish a placeholder as a complete course.

Include an owner/admin workflow for inspecting imports, reviewing explanations and sources, mapping content, publishing and correcting. Implementation can begin with a minimal admin interface and structured imports rather than a complex authoring studio.

Complete preparation for a marketed exam means its current published scope is mapped and supported by usable teaching, practice, revision and exam-configured tests. Set actual content-production quantities in the implementation plan after the inventory; do not manufacture thresholds from existing file counts. An incomplete path may be tested in a clearly labelled pilot but cannot be marketed as complete.

## 11. Website, app and visual direction

The accepted concept establishes the main flow: Discover -> Choose a path -> Study plan -> Learn and practise -> Progress. Full product navigation must also make tests/mocks, revision, current affairs, AI and account/access settings readily available; the five mockup steps are not the final complete navigation.

Use a calm navy interface, warm accent actions, readable text, editorial headings, restrained panels and clear content hierarchy. Respect reduced motion, keyboard access, contrast, readable mobile layouts and touch targets. The earlier July claim that a colour itself improves learning is not a product requirement or an evidence-based marketing claim.

The website and app share the same content versions, account, purchases and evidence. Prevent stale cross-device state from losing answers or double-counting activity. Begin online-first. Downloads, offline assessed tests, push notifications and native platform features require separate explicit scope decisions rather than being assumed by the word app.

### Web-first delivery

The owner explicitly chose a web app initially because APK and iOS builds add time. Deliver the learning journey in desktop and phone browsers with a shared responsive frontend. Native/store builds are deferred.

Agreed architecture: use React and TypeScript for the learner interface, Next.js for public guides and hosted web functions, and a shared backend. Keep the learner interface independently buildable as browser assets so it can later be packaged using Capacitor. Do not couple the learner screens to request-time Next.js rendering or Server Actions that cannot run in the packaged client.

Add home-screen installation metadata and icons as a small progressive enhancement once the core browser experience works. Offline learning, push notifications and store distribution remain separate features. The future mobile work includes platform integration, testing, signing, billing review and releases; approval of this architecture does not authorise APK/iOS builds now.

Cross-platform research completed on 17 October 2026 is recorded in `docs/research/2026-10-17-cross-platform-strategy.md`. It supports the chosen structure without claiming that an arbitrary full-stack Next.js app can be bundled unchanged. The public website and learner interface can use different build targets inside one repository, sharing appropriate components and contracts. The implementation plan should settle the simplest workable package layout. Expo/React Native or Flutter would be a later architecture change rather than an assumed part of the chosen route.

## 12. Architecture and builder discretion

Use a shared authenticated backend for content, attempts, progress and entitlements. Separate content publishing and student actions. Keep model calls and payment credentials server-side. Persist exam/session deadlines and versioned attempt evidence so calculations are reproducible.

The agreed frontend family is React/TypeScript with Next.js for the public/server web layer and a separately buildable learner interface. The builder should select currently supported versions and may choose the client bundler, backend provider, auth methods, database schema, Markdown rendering approach, model provider, retrieval engine, deployment tooling and testing libraries. The July Next.js/Supabase proposal is a starting point, not a requirement to install its historical versions or recreate its exact 23 tables. Explain material technology choices in the implementation plan.

The implementation plan should phase foundation/content inventory, beginner experience, learning/practice, assessment/revision/progress, cross-device app experience, AI, entitlements and commercial readiness. Phasing does not remove required product outcomes. Keep the full design scope distinct from any labelled pilot.

Engineering baseline accepted on 24 October 2026: small reviewable batches, semantic writer/reader contracts, standard automated checks, risk-based independent review, applicable OWASP ASVS security mapping and a concise threat model, WCAG 2.2 AA as the verification target, and distinct software/content/operational readiness. Include a student content-report and owner-resolution path preserving versioned historical attempts. The baseline is detailed in `docs/research/2026-10-23-engineering-standards.md` and the linked coding/discipline documents; it does not claim installed gates, conformance or certification. Local development and managed Supabase Free are the current starting direction. Commercial web hosting and Oracle use remain separate decisions.

No external service creation, live data migration, production payment activation, public deployment, commit or push is authorised merely by writing this design. Normal reversible local implementation follows only after full design approval and a plan.

## 13. Required verification before a release

- Trace each published exam path to its approved syllabus and current exam configuration.
- Verify representative imported passages, questions, answers, explanations and source records against originals, including review-flagged records.
- Exercise a beginner's discovery -> selection -> lesson -> practice -> revision -> mock -> review -> updated-plan journey for CLAT and the supported secondary paths.
- Verify separate coverage, independent/assisted performance and later-retention evidence; check sparse-data states and target changes.
- Verify account isolation, cross-device resume, answer saves, refresh/reconnect, time expiry and scoring for each marking configuration.
- Check free/paid/AI access, expired subscriptions, allowance exhaustion, payment-event replay and AI-provider failure without losing student work.
- Evaluate AI against a fixed set of sourced tutoring, mistake-review and planning examples. Include misleading premises, missing sources, disputed answer keys and assistance leakage into assessment.
- Check keyboard and screen-reader navigation, narrow/mobile and desktop layouts, readable explanations and reduced-motion behaviour.
- Confirm marketing claims, tier inclusions and published content coverage match the actual release.

## 14. Remaining approval boundary

The fresh builder review identified exam-route ambiguity, now resolved explicitly in section 1 from the existing project materials. Its app-format question is resolved by the owner's subsequent explicit web-first decision. Prices and commercial-release mechanics can be planned without fixing them during brainstorming.

The owner accepted the lay explanation of the shared learner interface, hosted backend, Next.js public website and later Capacitor packaging on 18 October 2026, and approved this full consolidated design on 23 October 2026. The next authorised step is implementation planning. Keep unresolved prices and operational launch choices explicit rather than blocking local implementation unnecessarily.

A second fresh builder check of this consolidated version returned "nothing important left" on 18 October 2026. It found no further owner questions required to plan implementation. This checks clarity and planning completeness, not the correctness of unpublished content or the effectiveness of future AI features.

The full-design approval authorises planning; it does not authorise publication, service provisioning, real payments, native builds, commits or pushes.
