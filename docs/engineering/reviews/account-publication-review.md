# Local account and publishing review

28 October 2026. Independent reviewer: `/root/checklist_review`. Implementer: `/root`. Verdict: accepted for this scoped local batch, with no unresolved Critical, Important or Minor findings. No complete Task 3/4, hosted activation, final product or production acceptance.

Final independently confirmed source fingerprint: `bf8204c21af881ad3d94f5f11f647ba79154e591008cdf94dd50c0a5c6c69453`. The existing fingerprint walker excludes this reviews directory. Historical `foundation.json` is unchanged; its acceptance checker correctly exits 1 because it does not match current work. This record does not bypass that gate.

## Scope and decisions

Strict account/profile/editorial/catalogue contracts; request-scoped Supabase bearer clients and runtime verification; caller-owned revisioned profiles; current-session RLS/Storage helper; canonical private publication transactions; same-input idempotency; immutable correction/withdrawal history; standalone account and owner screens; structured import preview and public metadata reader. Public project configuration is in ignored local files only; no service-role key. Owner identity is supplied by the user but no Auth identity or membership has been created. Current live project remains on its previously approved catalogue foundation.

The high-risk continuation plan was independently accepted after adding direct profile/history/Storage session checks, not just API checks. Plan SHA256: `F539217A1AFF53C1CCF5A71A84D3D28C1347E02502B9461E5E288A76543EFBE2`. Primary implementation continues in the existing isolated worktree without commits or pushes.

Reviewed activation artifacts, all unapplied:

| Artifact | SHA256 |
| --- | --- |
| `supabase/migrations/20261028045828_account_publication.sql` | `071DFF8981467FD349ACADE04C448F2D20CC8D57B22134A0BE5078289C58CF58` |
| `supabase/migrations/20261028051001_provider_helper_execute_hardening.sql` | `AD0221EBE3CC3F913340DC88CD7BD9F01D60E5D022B151161D939567F780D7C7` |
| `supabase/operations/enrol-owner.sql` | `B66D2C250CC707BA200F64DBD3C1B3CCE6FB16C33C9342CD7958723F989098C9` |
| `supabase/templates/email-sign-in.html` | `649AC8F815CC223DAA6572627B1EECD0BB76AEF0ED3490CC45C5333951C5BFE7` |

Provider helper/owner/trigger/grants were read from the dedicated live project before preparing ACL-only hardening. The enrolment template requires exactly one confirmed nonanonymous matching user and a live session; it is never called by the app or migrations. The email template has static copy and the provider `.Token` placeholder, not an actual code. Activation requires separate owner instruction under AGENTS.md. No hosted writes, enrolment, email-setting changes or owner email were initiated during this batch.

## Review findings and closure

- Routine refresh unmounted unsaved forms. Same-user refresh now retains the mounted form while access revalidates; identity change/logout/rejection clears private state. Browser regression covers refreshed/same-user signed-in events.
- Delayed logout could erase a new account. Reviewer independently reproduced the installed SDK race using in-memory storage and fixture fetch. Store serializes sign-out; send/verify cannot begin until cleanup finishes. Browser covers delayed logout, failed revocation and delayed A profile followed by B sign-in.
- Repeated current-version/new-draft selection could leave permanent loading. Explicit refetch now occurs; built-browser regression observed failure before fix and then passed.
- Revised questions silently dropped options outside A–D. All valid option identities are preserved, including E/F and the matching key; regression observed failure before fix and then passed.
- Duplicate topic IDs across cycles could be mis-selected. Topic/prerequisite controls filter to the chosen cycle and reset dependent selection.
- Saving a source cancelled an unsaved revision. Only successful draft save finishes editing; metadata refresh retains typed work.
- Direct SQL could persist whitespace-only/malformed URL data or raw option/key IDs rejected/changed by readers. Shared conservative URL grammar, ECMAScript whitespace, UTF-16 bounds and canonical stored options/keys now align boundaries; SQL-engine negative/roundtrip preflight and canonical test cases added.
- Audit request IDs were globally unique while receipts were per publisher. Forward constraint uses `(actor_id,mutation_id)`; two-publisher preflight passed and pgTAP regression is authored.
- Postgres `Factory` timezone is rejected by Intl. Primary read all 598 hosted timezone names and confirmed this sole mismatch against installed Node Intl. SQL regression observed RED before explicit sentinel rejection and GREEN after.
- Source dates could normalize into five-digit/BC UTC years. Shared input and SQL now bound normalized years to 0001–9999. Contract and disposable SQL regressions observed RED before fix, GREEN after; canonical tests authored.
- Final minor checklist status drift corrected. Existing ASVS map now points to partial local tests and retains all five requirements pending.

Auth refresh/logout initial corrections were source-inspected before their browser regressions were added; no pre-fix browser RED is claimed for those fixes. The independent SDK race reproduction and post-fix built regressions provide scoped evidence, not a retroactive TDD claim.

## Verification and checklist evidence

Primary `npm run verify` exited 0: ten iteration gates PASS; acceptance-only review NOT_APPLICABLE. Process 19, unit 25, HTTP 15, built Chromium 16; zero skips/unexpected/flaky browser results. Includes compiler, lint, browser import guard, builds and emitted-asset scan. The reviewer inspected this evidence and independently confirmed the final fingerprint, SQL/enrolment hashes and policy check. After the build, only the unchanged email-template relocation and descriptive checklist/security-map/doc edits occurred; affected policy check passed again. No behavior rerun was needed for those edits.

Ignored evidence: `.superpowers/sdd/2026-10-23-law-prep-platform-implementation/auth-publication-verify.log`. Visual inspection: `output/auth-publication/{account,editor}-{desktop,phone}.png`; reduced-motion screenshots and phone reflow checked. Browser fixtures explicitly block unmatched Supabase routes. An early fixture URL matcher missed the SDK redirect query; it was corrected and made fail-closed, and a read-only live check confirmed neither the reserved fixture email nor owner account exists.

| Checklist scope | Result and limit |
| --- | --- |
| A01–A05; B01–B02, B04–B07 | PASS for local typed boundaries, semantic registry, pinned SDK, account isolation, async UI and verification; complete persisted multi-device evidence remains blocked |
| C01–C05, C07 | Local protocol/static checks PASS; real Auth/RPC/RLS/REST/Storage and hosted email/rate-limit acceptance BLOCKED. ASVS statuses remain pending |
| C06 | Hosted browser security headers/CSP/HTTPS acceptance BLOCKED before release |
| D01–D04 | Target/initial state confirmed read-only; new SQL statically accepted and disposable engine preflight PASS; actual Supabase continuation/grants/concurrency acceptance BLOCKED |
| D05–D08 | Clean Supabase replay/type refresh, real query/volume/asset checks and restore evidence BLOCKED; no recovery or availability claim |
| E01–E02 | Local/private source/rights/review/history controls prepared; complete editorial/import-to-publication/coverage acceptance BLOCKED |
| E03–E05, F01–F04 | NOT_APPLICABLE to this account/publication batch; assessment, evidence, AI and billing have later owning tasks |
| G01–G04 | Installed local gates PASS; real-boundary and manual screen-reader/WCAG/hosted CI requirements remain pending |
| G05–G06 | Request IDs and activation/forward-fix notes prepared; complete operations/release acceptance pending |

Additional SQL syntax/behavior preflight: disposable PGlite 0.5.12 / PostgreSQL 18.6, with minimal synthetic Auth/Storage bootstrap. All three migrations replayed; sequential draft/review/publish/correct/withdraw, validation negatives, canonical keys, publisher-scoped UUIDs, profile revision and revoked-session denial checked. Known-bad control exits 1. This is not actual Supabase 17, pgTAP, Auth tokens, HTTP/Storage service, clean Supabase replay or concurrent connections. Harness/evidence remain ignored under `sql-preflight/`; no new production dependency.

## Pending and authorization boundary

New hosted migrations, canonical pgTAP, generated DB types, real owner OTP/delivery, exact callback configuration, multi-device profile restoration, direct REST/Storage revocation, simultaneous operations, clean Supabase replay, private asset services and full legacy import roundtrip remain required. Vite reports a large initial bundle; measure/split it in the performance pass. Complete course content, assessment/progress/AI, accessibility audit and operations are not delivered by this batch.

Software: local batch verified/reviewed, real activation pending. Content: remains draft/unpublished. Operations: hosted delivery/recovery/release checks pending. No commit, push, public deployment, charge or native build. Next proposed external action is explicit approval of the reviewed development activation and temporary tests; owner membership only after matching email verification.
