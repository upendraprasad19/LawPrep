# Account and publication development activation review

28 October 2026. Scope: the explicitly approved activation in `lawprep-dev` (`gacxelyzqoftocfmlisy`), scoped tests, public database types and typed server integration. This supplements the historical local-preparation review; it does not replace `foundation.json` or accept complete Tasks 3–4 or production readiness.

Independent reviewer `/root/checklist_review` accepted this batch without unresolved findings, bound to source fingerprint `5815692991eb83ec163f5fdd1f36b42b3e079138076131187587ac908cf230a1`.

## Applied artifacts

| Hosted/local migration version | SHA256 of unchanged reviewed SQL |
| --- | --- |
| `20261028055949_account_publication.sql` | `071DFF8981467FD349ACADE04C448F2D20CC8D57B22134A0BE5078289C58CF58` |
| `20261028055957_provider_helper_execute_hardening.sql` | `AD0221EBE3CC3F913340DC88CD7BD9F01D60E5D022B151161D939567F780D7C7` |

The provider assigned these versions on application. Local preparation filenames were reconciled to observed history without changing SQL bytes or rewriting hosted history. Existing catalog migration `20261027154900` remains unchanged. Owner enrolment and email template were not applied.

## Evidence and limits

- Real hosted PostgreSQL canonical tests: catalog 49, ownership 25, publication 38, provider hardening 3 and isolation 2: **117 assertions passed**. Rollback adapters preserve canonical statements, use `finish(true)` and exact plan checks. An added deliberately failing assertion correctly failed the 39-assertion publication control.
- Cleanup verified by primary and independently read by reviewer: all 15 project tables, Auth users and sessions empty; pgTAP and temporary provider fixture absent. All project tables have RLS enabled. Synthetic identity/session fixtures existed only inside rolled-back tests; no real owner identity or membership was created.
- Provider helper EXECUTE removed from public application roles; existing owner and event trigger preserved. Public database types independently regenerated and matched checked-in output. Typed server clients now consume those types, and editor reads omit the optional UUID argument when absent to use its actual SQL default.
- Nine actual HTTP checks passed: local catalogue API through the live database for all three tracks, anonymous denial at private local routes and direct Supabase RPC/profile endpoints, and direct anonymous metadata-catalogue access. This does not prove real authenticated GoTrue-issued tokens, delivery or Storage HTTP behavior.
- `npm run verify` exited 0: ten iteration gates PASS, acceptance-only review NOT_APPLICABLE. Process 19, unit 25, HTTP 15 and browser 16; browser skips/unexpected/flaky all zero. Compiler, lint, import boundaries, build and emitted asset scan passed. The historical milestone review record remains unchanged and cannot accept current whole-source work.
- Security advisor: nine INFO notices on intentionally default-denied private tables; prior provider EXECUTE warning removed. Performance advisor: three foreign-key index and two unused-index INFO findings retained for workload/EXPLAIN measurement; no blanket security/performance acceptance.

Ignored evidence lives under `.superpowers/sdd/2026-10-23-law-prep-platform-implementation/`: `activation-hosted-evidence.json`, `activation-hosted-*.sql`, `activation-http-evidence.json`, `activation-http.mjs`, and `activation-verify.log`. These are development evidence, not a production release record.

Checklist continuation: A/B typed boundaries and G installed local checks pass within this scope. C/D now have real hosted SQL roles/RLS and anonymous HTTP evidence plus fresh public types; real authenticated, concurrent, replay, recovery and hosted delivery checks remain pending. E editorial lifecycle has SQL evidence but full rights/import/private-assets and public content acceptance remain pending. Other pending checklist requirements retain their owning tasks; no ASVS status was promoted to complete.

## Deferred handoff

The owner explicitly confirmed the development activation, reviewed sign-in template and conditional owner enrolment. The dashboard requires login; the owner chose to sign in later. Preserve that authorization and resume email configuration and enrolment without asking for the same approval again. Grant membership only after exactly one matching confirmed, nonanonymous real owner identity with a live session exists. Never request passwords or codes in chat.

Email/callback setup, SMTP/delivery, real authenticated Auth/REST/Storage revocation, multi-device behavior, concurrency, clean Supabase replay, private asset services and full legacy import acceptance remain pending. No commit, push, public deployment, charge or native build occurred.
