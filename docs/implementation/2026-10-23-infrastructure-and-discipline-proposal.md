# Law Prep infrastructure and engineering discipline

Status: engineering discipline baseline accepted by the owner on 24 October 2026. Infrastructure alternatives and commercial hosting selection remain provisional as described below. No hosted resources, repository settings, hooks or workflows have been changed.

Update: the owner prefers new free-tier Supabase/Vercel accounts and has an Oracle Always Free VPS available. Start with local development and managed Supabase Free for the initial pilot, subject to actual account/project limits. Hosting remains unresolved for the commercial product because Vercel Hobby is personal/noncommercial only; a new account does not remove that restriction. Do not assume that disabling checkout alone makes a business deployment eligible. Oracle hosting is an alternative to assess, not an approved deployment. Detailed coding rules are proposed in `docs/implementation/2026-10-23-coding-standards-proposal.md`.

Accepted industry supplement: `docs/research/2026-10-23-engineering-standards.md` compares DORA, Google engineering/SRE, NIST SSDF, OWASP ASVS/GenAI, W3C, GitLab and Moodle guidance. Keep initial enforcement thin, map applicable security requirements, target WCAG 2.2 AA, use a concise threat model and separate software, educational/content and operational acceptance. The owner accepted this working process on 24 October 2026; no certification, completed conformance or active controls are claimed.

## Recommended infrastructure

The table below records the environment roles, not a requirement to buy all paid plans before development. The owner's free-tier-first preference above supersedes the illustrative paid budget as the starting direction.

| Component | Recommendation | Purpose |
| --- | --- | --- |
| Source and automation | Existing `upendraprasad19/LawPrep` GitHub repository | Code, review, issue history, automated checks |
| Local development | Local Supabase using Docker plus local Next.js/Vite | Build/test without production credentials or hosting spend |
| Shared testing | Dedicated Law Prep staging Supabase project | Synthetic accounts/content, preview and sandbox verification |
| Real student data | Separate Law Prep production Supabase project | Postgres database, Auth and private Storage |
| Website and server API | Vercel project with preview/production environments | Next.js public pages, hosted API, static learner assets |
| AI | Server-side provider adapter selected through evaluation | Optional tutor/planner/review; independently metered costs |
| Payments | Merchant/provider adapter selected before paid launch | Sandbox first; disabled until terms and activation approved |

These are proposed names/roles, not existing project selections. Use the owner's chosen account/organization, with separate project keys and access per environment. Do not reuse AVYA/Ecosystem databases, roles, credentials, customer records or billing integrations. An existing paid organization may host independent Law Prep projects if the owner chooses it; a new Supabase account is not inherently required.

Preview deployments must connect only to staging, never production. Shared staging uses synthetic data. For simultaneous developer branches, use separate local databases or isolated test namespaces/accounts; never run destructive test cleanup on production. Align database and server regions where practical for the intended student audience; choose available regions during provisioning.

GitHub Pages serves static HTML/CSS/JavaScript and cannot execute the planned Next.js API/server features. A static learner could technically call a separately hosted backend, but that changes deployment boundaries and does not solve commercial hosting-policy constraints. GitHub's Pages limits prohibit using Pages as free hosting for an online business/commercial SaaS. Use it only for a permissible static, noncommercial preview/documentation use case, if wanted.

Vercel is recommended for the accepted Next.js stack, not mandatory: a compatible managed Node.js host or container host can run it. Choosing another host requires configuring the equivalent preview environments, secrets, networking, logs and release gates. Vercel Hobby is noncommercial/personal-use only; choose an appropriate commercial plan for this product.

Current listed entry prices: Vercel Pro $20/month and Supabase Pro from $25/month, with an additional Supabase project from $10/month. A new paid setup with production plus staging therefore starts around $55/month before tax, usage/compute differences, AI, email, domain and payment fees. This is an illustration, not a quote for the owner's existing accounts. Local implementation can begin without these hosted plans. Set budget alerts and usage controls before activation; payment cards and secrets belong in provider dashboards/secret stores, not chat or Git.

Sources checked: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying), [Vercel Hobby terms](https://vercel.com/docs/plans/hobby), [Vercel pricing](https://vercel.com/pricing), [Supabase pricing](https://supabase.com/pricing), [Supabase environment separation](https://supabase.com/docs/guides/deployment/managing-environments).

### Oracle VPS option and free-tier limits

An Oracle VM can host self-managed PostgreSQL, or the wider Supabase Docker stack when its architecture, CPU, RAM, disk and available headroom support the required containers. Plain PostgreSQL replaces the database only; it does not automatically provide Supabase Auth, Storage and APIs. Running PostgreSQL on Oracle is a different deployment from a managed Supabase project. Switching to self-hosting is an operational deployment/migration project requiring an explicit design.

Current Supabase Docker guidance lists a minimum of 2 CPU cores, 4 GB RAM and 40 GB SSD for the full stack, recommending more headroom. Oracle has different VM shapes and documents possible idle Always Free instance reclamation; do not infer the user's machine capacity or reliability from the words free tier. Before any proposed deployment, inspect the actual shape/architecture, running services and resource headroom with authorized read-only access, then verify container compatibility. No VPS access has been requested or performed.

For self-hosting, the owner/operator assumes OS/database/container upgrades, HTTPS/firewall configuration, credential management, backups stored outside the same VPS, restore drills and outage monitoring. Application and database can share a small VPS for a pilot if resources permit, but that creates a shared failure point and competes with existing services. Do not replace or disturb existing workloads without explicit scope/approval.

Recommendation: use managed Supabase Free initially and hold the Oracle database option until measurement justifies the operational work. Oracle can alternatively host the website/API with managed Supabase, avoiding a Vercel dependency while leaving the database managed; this requires its own setup/preview/release plan. No database migration is needed merely to change the Next.js hosting provider.

Supabase Free currently lists 500 MB database storage, 1 GB file storage, 5 GB egress and pausing after one week of inactivity. Track actual use and plan backups/recovery before real reliance; free-tier availability is not a production availability promise. Model-provider usage remains separately billed unless covered by a verified provider allowance. Start free without treating all later services as cost-free.

Sources: [Supabase self-hosting requirements](https://supabase.com/docs/guides/self-hosting/docker), [Supabase Free limits](https://supabase.com/pricing), [Oracle Always Free shapes and reclamation](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), [Vercel commercial-use definition](https://vercel.com/docs/limits/fair-use-guidelines).

## Reference repository inspection

Read-only GitHub inspection at these snapshots:

- Icanbefitter Ecosystem: `5e89de7e5a4c8176ebc8db5e93538ef2222c1c60`.
- AVYA: `87a0d8d1bdf99d57fc86598974b51b9c42ae7ba1`.
- LawPrep: `81b9a3ffa8eb4d480918a8303a8b11d2c445ab42`; the current tree contains README.md only. Law Prep's present local design/plan documents are not on that branch.

Useful current references:

| Verified reference | What to adapt |
| --- | --- |
| [Ecosystem root rules](https://github.com/upendraprasad19/Icanbefitter_Ecosystem/blob/5e89de7e5a4c8176ebc8db5e93538ef2222c1c60/claude.md), [pre-push](https://github.com/upendraprasad19/Icanbefitter_Ecosystem/blob/5e89de7e5a4c8176ebc8db5e93538ef2222c1c60/.githooks/pre-push) | Worktree isolation, central data access, scoped privileged access, hook installation checks, browser/preview evidence, review ledger, CI result reconciliation |
| [Ecosystem audit workflow](https://github.com/upendraprasad19/Icanbefitter_Ecosystem/blob/5e89de7e5a4c8176ebc8db5e93538ef2222c1c60/.github/workflows/audit.yml), [gate core](https://github.com/upendraprasad19/Icanbefitter_Ecosystem/blob/5e89de7e5a4c8176ebc8db5e93538ef2222c1c60/scripts/lib/gate-core.mjs) | Local/CI consistency, no empty scans, gate fixtures and regression budgets. Current schema audit tolerates a historical baseline and anonymous-access audit can skip missing credentials; new Law Prep starts without that legacy debt. Mutation workflow is currently scheduled/manual and report-only, not a required PR check. |
| [AVYA current rules](https://github.com/upendraprasad19/AVYA/blob/87a0d8d1bdf99d57fc86598974b51b9c42ae7ba1/CLAUDE.md), [discipline checklist](https://github.com/upendraprasad19/AVYA/blob/87a0d8d1bdf99d57fc86598974b51b9c42ae7ba1/docs/discipline.md) | Bug-history lookup, trace writers/readers, contract tests, account isolation, timestamp handling, telemetry and a batch closeout record |
| [AVYA overhead review](https://github.com/upendraprasad19/AVYA/blob/87a0d8d1bdf99d57fc86598974b51b9c42ae7ba1/docs/superpowers/specs/2026-09-17-discipline-overhead-v2-design.md) | Scale review depth to consequence; run compiler/linter before human/agent review; avoid brittle source-line tests and repeated full-suite runs per tiny edit |
| [AVYA test workflow](https://github.com/upendraprasad19/AVYA/blob/87a0d8d1bdf99d57fc86598974b51b9c42ae7ba1/.github/workflows/test.yml) | Test shards need a gate requiring all shard results to be success. Current hosted integration job warns and skips tests when secrets are missing; Law Prep required database tests must run in isolated local CI instead. |

The latest visible main workflow run for each reference repository was successful when checked. That is not proof every optional job ran or that the product is production-ready. GitHub branch metadata reported Ecosystem main `protected:false`, AVYA main `protected:true`. Detailed AVYA protection settings returned 403 to this integration, so exact required checks/bypass settings were not verified. The prose statement in AVYA's root file that main has no required checks must not be treated as verified current configuration. No settings were changed.

Reference rules are design input, not governing Law Prep instructions. Do not import Flutter/Hive/Riverpod/APK assumptions, fitness subscription rules, brand styling, numeric thresholds or an entire collection of historical gates. Claude-specific reminder hooks do not automatically run in Codex; core enforcement must live in portable project scripts and GitHub checks.

## Proposed Law Prep process

### 1. Small authoritative rule set

At execution, create a short root AGENTS.md with links to `docs/engineering/discipline.md`, contracts, an issue/diagnosis index and the quality-gate registry. Maintain one owner per concept: exam configuration, content publication, question keys, attempt state, scoring, learner evidence, subscriptions and AI usage. For each critical concept record its writer, readers, storage, API contract, behavioral tests and failure telemetry. Prefer symbol/file references and executable schemas over fragile hand-maintained line numbers/counts.

### 2. Isolated, bounded work

Recheck remote and local state before repository integration. Preserve this non-Git folder and import its approved assets into a safe checkout only when execution is authorized; do not reset it. Use one managed worktree per active implementation session. Select the execution method at batch start. Keep batches small enough to review, with explicit acceptance criteria, touched contracts, risk tier and any operational dependencies. Commits/pushes remain separately authorized under the user's global rule; approval to execute does not waive it.

### 3. Test before accepting behavior

For meaningful behavior, reproduce a failing case before implementation and retain the regression test. Verify critical protections by deliberately breaking the relevant rule once and confirming the test fails for that behavior, not a compile error. Particularly cover server scoring/deadlines, account isolation, duplicate/conflicting answer saves, content version freezes, subscription event replay and concurrent AI allowance use. Use browser flows for layout and actual student interactions; unit test counts alone are not acceptance evidence.

For a trivial copy/style adjustment, use focused visual/accessibility verification rather than inventing implementation-mirroring tests. For a recurrence, consult the existing diagnosis first and fix the relevant class across known readers/writers.

### 4. Portable quality command and honest results

Provide `npm run verify` as the shared local/CI entry point, implemented by `scripts/verify.mjs` and `quality-gates.json`. Each registered gate declares its command, scope, activation milestone and required/advisory status. Results are PASS, FAIL, BLOCKED or NOT_APPLICABLE with a reason and evidence; only genuine PASS satisfies an applicable required gate. A missing executable, missing credential, missing expected test, empty scan, cancelled job or malformed report never silently satisfies it. Optional session reminders may fail softly, but required release checks fail closed.

Keep this a thin wrapper over standard commands. Use standard lint/import restrictions, schema validation and behavioral tests before creating bespoke scanners; do not build a generic policy engine before the product. High-value contract registration is required, not an exhaustive ledger for every UI helper.

Activate foundational gates during bootstrap; activate product gates in the task introducing the relevant code. Do not pretend unimplemented functionality has passed. Once active, disabling/downgrading a required gate is an explicit reviewed policy change. Every new custom gate has known-good and known-bad fixtures, including missing-input behavior, and a test proving its actual local/CI invocation. Standard tools are preferred over bespoke scanners.

Required baseline checks, when applicable: locked dependency install; supported matching runtime; typecheck; lint; behavioral tests; production build; isolated Postgres migration replay and generated-type drift; real two-account RLS tests; browser core journeys; secret and production dependency scanning; client/server import boundary; reviewed-content coverage. AI/provider and merchant sandbox checks become required when those features are enabled. Advisory heuristics may begin report-only with a reason/owner and promotion criteria; account isolation and secret exposure are never merely advisory.

Secret checks must include docs/config/generated frontend assets as appropriate, distinguish publishable configuration from privileged credentials, and avoid printing credential values. Run read-only dependency analysis in checks; do not auto-upgrade packages during verification.

### 5. Review by consequence

| Proposed risk tier | Examples | Required review |
| --- | --- | --- |
| Low | Copy, local styling, no auth/data/scoring/billing behavior | Focused checks and browser evidence; implementer self-review |
| Normal | Lesson navigation, plan presentation, ordinary learner feature | Relevant contract/browser tests and one independent code review before integration |
| High | Auth/RLS, schema, privileged access, scoring/deadlines, payments, content publication, progress semantics, AI data/quota boundaries, release tooling | Independent plan review before implementation; independent security/domain review after implementation; two-account/concurrency/regression evidence as applicable |

High-risk work in the current 16-task product plan needs review even if the chosen execution method is one primary implementer. The final whole-product review is additional to high-risk boundary review. A review record identifies the exact reviewed commit or uncommitted-diff fingerprint, checks run, findings/resolutions and remaining blockers. Material changes after review invalidate the affected acceptance and require re-review. One reviewer may cover multiple adjacent high-risk tasks as a coherent batch; do not demand two full blind reviews for every cosmetic edit. No review has yet been dispatched under this proposal.

### 6. GitHub and release gates

Configure pull requests with stable required status checks, an aggregate job that requires every applicable dependency to pass, stale-review dismissal where applicable, resolved review discussions and restricted direct updates to main. Verify the actual ruleset and available GitHub plan features; a script/document claiming protection is not proof of hosted enforcement. If independent human approval is unavailable for a solo-owned repo, record the independent code review as an explicit process requirement; do not configure an impossible self-approval gate or label an agent review a GitHub approval. Default merge/release operations remain human-authorized.

CI runs on pull requests and main updates, with job timeouts and cancellation of superseded nonproduction work. Use least-privilege workflow permissions and verified pinned action revisions. Tests get disposable local databases and synthetic identities, not production access. Avoid executing untrusted PR code with privileged secrets. Budget expensive mutation/full-provider evaluations separately; required regression and security checks still gate applicable changes.

Preview builds use staging. Test actual preview flows before release. Production deployment is a separate protected/manual promotion of the tested artifact/commit, not an incidental consequence of pushing a branch. When configuring hosting, verify its auto-deploy integration cannot bypass this boundary. Database migrations are reviewed, reproducible and applied explicitly; destructive changes require a backup/recovery plan and compatibility review. Application rollback does not undo data/schema changes; prefer backward-compatible schema rollout and tested forward repair.

### 7. Operability and release closeout

Before real students: verify error reporting, request IDs and save/scoring/webhook/AI failure visibility with redaction; synthetic smoke tests; backups and a restore exercise for database and private stored content; auth email delivery; cost limits; ownership/account recovery; and support/contact/privacy/terms/refund information suitable for the launch audience. Specify retention/deletion/export behavior before collecting production student records. Review applicable student/minor-data requirements before launch rather than guessing them in code.

Close each significant batch with checks/results, browser evidence, content-coverage changes, schema/provider changes, review findings, open blockers with owner/reopen condition and a short retrospective. A script validates required evidence fields and links; a reviewer checks whether the evidence actually supports the claim. Distinguish local implementation, tested staging and live production in all status reports. Keep a small backlog rather than silently downgrading failures.

## What is needed from the owner

Before local execution: choose the execution approach; this process baseline is already accepted. The owner prefers free-tier-first; keep local work independent of paid services and settle any AI/hosting spending before activation. Identify the preferred account/organization for future Law Prep projects when needed. Product name/domain can stay provisional, and hosted access is not needed to begin local work. Docker is installed on this machine; daemon readiness and local Supabase compatibility still require execution-time verification.

Before shared staging: authorize dedicated projects, select the account/organization, connect the relevant hosting/provider access securely and approve the environment/budget settings. No passwords/API secrets need to be pasted into chat.

Before launch: confirm product/domain and sender identity, named content review responsibility and source permissions, actual billing prices/terms/provider, approved AI allowance/budget, operational contacts/policies and explicit production activation. Review selected real beginner/student flows; software tests cannot replace content expertise or student usability feedback.

Next step: incorporate the accepted engineering baseline into the implementation plan, then select the execution approach. Hosted infrastructure alternatives remain separate operational choices. No product implementation has started.
