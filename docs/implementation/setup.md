# Local setup

Implementation workspace: the managed `law-prep-platform` checkout, branch `codex/law-prep-platform`. The original prototype and papers are preserved. They are not automatically published or copied into browser assets.

## Runtime and pinned packages

Resolved against npm on 24 October 2026. Node 24 LTS and npm 11 are required; `package-lock.json` records the complete dependency tree.

| Tool | Version |
| --- | --- |
| Verified local Node / npm | 24.20.0 / 11.19.0 |
| Next.js | 16.4.3 |
| React / React DOM | 19.3.1 |
| Vite / React plugin | 8.3.5 / 6.1.2 |
| TypeScript | 6.0.2 |
| Zod | 4.6.7 |
| React Router | 7.18.4 |
| Vitest | 5.0.5 |
| Playwright | 1.64.1 |
| ESLint / typescript-eslint | 10.13.0 / 8.72.0 |
| Supabase JS (account/publication continuation) | 2.118.0 |

Linting uses the official ESLint, TypeScript, React Hooks and Next.js plugin configurations directly. Next's bundled aggregate configuration currently pulls React/import/accessibility plugins whose declared peers exclude ESLint 10. We use compatible current plugins instead of forcing peer overrides or retaining an unsupported ESLint release. Accessibility verification remains a separate release requirement.

## Start and verify

1. Run `npm ci`.
2. Install the test browser: `node node_modules/@playwright/test/cli.js install chromium --only-shell`. On Linux CI, also pass `--with-deps`.
3. Run `npm run dev`. It builds/stages the learner, then starts the public site at `http://127.0.0.1:3100`.
4. Open `/study/#/` on that site for the learner. For fast learner-only development use `npm run dev:learner` at `http://127.0.0.1:5173`.
5. Run `npm run verify` for iteration, and `npm run verify:milestone` for acceptance with independent current-source review.

Individual commands: `npm run test:unit -- <file>`, `npm run test:integration -- <file>`, `npm run test:e2e -- <file>`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run check:boundary`.

The built public site uses port 43173 (`npm run start`); the standalone learner uses 43174 (`npm run preview --workspace=@lawprep/learner`). These deliberately avoid another local application's port 4173. Browser tests start and stop their own servers and refuse to reuse a pre-existing server.

`npm run build` builds Vite first, stages its static output at `apps/site/public/study/`, then builds Next.js. No Vite server is needed to serve the built site. Relative assets and the hash router make the same learner output statically servable. The explicit `/study` redirect checks the exact incoming pathname; a configuration redirect matching both slash variants would loop. API requests retain their registered paths.

## Environment and Supabase

No database is required to build the shell or run protocol fixtures. Account/profile and owner-publishing screens are implemented, and their reviewed RPCs are applied to the dedicated development project. On 30 October the owner completed actual email-link sign-in, verified enrolment and authenticated account/editor reads. Custom code emails require SMTP or Pro; broader provider acceptance remains pending. There is no stored student study progress or published course yet. See [account and publishing](account-publishing.md) for applied migrations, remaining email configuration and verification limits.

The dedicated hosted Supabase development project is `lawprep-dev`, ref `gacxelyzqoftocfmlisy`. The owner-approved catalogue foundation was recorded as `20261027154900_catalog_foundation` on 27 October. The confirmed continuation was applied on 28 October as `20261028055949_account_publication` and `20261028055957_provider_helper_execute_hardening`; local filenames match observed hosted history with identical reviewed bytes. Hosted pgTAP passed all 117 assertions, with synthetic records and test extension rolled back; negative control and cleanup were verified. Public DB types were refreshed. Public Next API-to-Supabase catalogue and anonymous REST denial checks passed. Real authenticated Auth/SMTP/Storage, concurrency and clean Supabase replay remain pending. Account/database passwords and secret/service-role keys must stay in secure local configuration or a project-scoped authenticated connection. Never put them in source, screenshots, frontend variables or chat.

Docker is an alternative for running a disposable Supabase stack locally. It is not required to build the website/learner, and students never need it. A hosted development project can replace it for development; isolated resettable test data is still required for destructive/concurrency tests.

The public learner API defaults to same-origin `/api/v1/`. An independently hosted learner may set `VITE_API_BASE_URL` in its build environment. Only public configuration belongs under `VITE_`/`NEXT_PUBLIC_`; tokens travel in Authorization headers. The API client rejects insecure non-loopback HTTP, embedded credentials, query parameters and fragments, and refuses redirects. Cross-origin/native authentication and origin policies are future integration work, not implied by the static build.

## Review and release scope

Read the [coding checklist](../engineering/coding-checklist.md) before changes and record applicable IDs/results in the current task ledger or review note. It covers both current checks and future release requirements without treating them as already passed.

The client milestone includes source graph checks with deliberately bad imports, an emitted-asset scan, transport tests, compiler/lint, both builds and real browser checks. It does not certify authentication, database ownership, payments, AI, complete content, operational readiness or mobile store builds. A source-bound independent review is required for milestone acceptance.

GitHub CI runs for pull requests and pushes to `main`. Branch protection and release deployment are separate. Seven owner-authorised migrations are applied in development, including the private intake, access, study preferences and CLAT sample. See the [activation review](../engineering/reviews/clat-sample-activation.md) for the hosted verification and pending conflict fix.

The [private collection intake](private-intake.md) is activated with all 1,313 existing structured records. Actual hosted reconciliation matched every original record hash and UTF-8 length; the 30 permission/integrity assertions and negative control passed with fixture cleanup. Public types are refreshed from the actual schema. The real owner can open `/study/#/imports` to browse original records. The Imported library is an owner review area; it does not publish unreviewed material on student routes. All 492 missing explanations, source/rights blockers and unverified BLET mapping remain explicit; thirteen PDF uploads remain separate.
