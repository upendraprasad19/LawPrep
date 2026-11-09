# Private legacy intake: prepared local scope review

Historical preparation snapshot. The approved activation and data load are now complete; see [current activation evidence](legacy-intake-activation.md). Unapplied-status statements below describe the earlier preparation review.

31 October 2026. User requested population of the existing collection. This review covers the prepared private intake and owner reader; **the new hosted migration and actual Supabase record load remain unapplied**. It does not accept complete Tasks 3–4, content correctness, publication or production readiness.

Independent reviewer `/root/checklist_review` found no remaining material findings after inspecting the schema, operator, private reader, DTO/API/client, owner UI, fixtures and evidence. Source fingerprint: `a9fafd078edc4c49fa4567551f884d8ea66e0f30637b52b010008b472d43f9b6`. Historical `foundation.json` is unchanged; no historical review is rebound to this source.

## Reviewed activation artifacts

- CLI-created `supabase/migrations/20261030181714_legacy_intake.sql`: SHA256 `9DD02494253594C5809B94DE901718F7CCEED0FFCB4E646DC91B80AA3ABAD351`.
- Prepared data operations in ignored task directory `legacy-intake/`: setup, chunks 000–032 and seal, plus manifest. Each was independently regenerated in memory from the unchanged original and saved extraction and compared byte-for-byte.
- SHA256 over execution-ordered filename, NUL, exact file bytes, NUL (setup → chunks → seal): `7e55e1063ff1cb176f6abfe7a5410f918a80cb2ed09ba055c938a32033a9d94f`.
- Same algorithm over all 36 alphabetically sorted files, including manifest: `13ffb1836c51710b32564538a04630b000f70554716e5019e17337ca4002fc67`. SQL-only alphabetical hash differs because its order differs; there was no artifact drift.
- Original source SHA256 `7dec12fd788d018298c15e8b5717667f540361680373579782816ab807f882cf`; extracted-file SHA256 `35aaccad420d11236dea414cfef62c432ac7759b8f2d59e6c509fe5a8485f703`; ordered record-set digest `75615f3b440cae6a8d7c650640b9669f6ac55cb940e45854d873343bec89ccef`.

## Findings and evidence

- Existing canonical draft path cannot faithfully hold incomplete explanations, local source snapshots, unverified BLET mappings or original curriculum/deck kinds. Raw records therefore enter separate private immutable staging; no fabricated canonical sources, explanations, review flags or published cycles.
- Reviewer caught a fixed DO dollar-delimiter boundary that inner string escaping did not protect. Actual PostgreSQL/WASM execution reproduced the parser failure before the fix. The generator now chooses a delimiter absent from the entire composed block; adversarial source containing the original delimiter, successive new delimiters, semicolon and backslashes roundtrips safely. Prepared files were regenerated afterward.
- Batch-scoped record identity is enforced by DTO and direct SQL. Unit regression observed failure before the fix; browser filters/paging pin the displayed batch. Reviewer verified shared parent-row locks for record insertion/completion, append rejection after seal and immutable original rows/provenance. Exact replays compare original record text/metadata plus digests; count-only matches are insufficient.
- First built browser run exposed the nested select label issue; explicit label/htmlFor/useId fixed it. Compiler then rejected a raw DOM string used as an enum; schema parsing now validates that boundary rather than casting it.
- Final `npm run verify` exited 0: ten installed iteration gates PASS, acceptance-only review NOT_APPLICABLE. Process 19, unit 31, HTTP 16, built Chromium 18; browser skipped/unexpected/flaky all zero. Compiler, lint, graph boundary, build and emitted asset scan passed. Protocol fixtures block unmatched real Supabase routes and do not send email.
- Supplemental PGlite/PostgreSQL 18 preflight reproduced a missing-reader failure before the migration, then matched every actual original record text and digest: 1,313/1,313, preserving all 492 empty explanations. Exact replay, changed reuse, hidden partial load, incomplete seal, immutable rows, raw HTML, kind/search/paging, no public catalogue effect and revoked-session denial were checked. This is not actual Supabase/PostgreSQL 17, pgTAP, SMTP, Storage or concurrent-connection acceptance.
- Canonical `supabase/tests/database/imports.test.sql` contains 30 authored rollback assertions. They have not been run on hosted Supabase. Reviewer read-only live inspection confirmed the intake tables/RPC remain absent and canonical versions/reviews/catalogue remain empty.

Ignored evidence: `intake-verify.log`, `intake-http-red.log`, `intake-browser-red.log`, `intake-batch-red.log`, `intake-delimiter-red.log`, `intake-sql-preflight.log`, and `sql-preflight/intake.mjs` under this plan's task directory. Private prepared SQL is not tracked or staged as public content.

## Applicable checklist and handoff

A01–A05/B01–B02/B06–B07: scoped typed boundaries, raw preservation, atomic visibility and cancellation tests PASS locally. C01–C05/C07/D01–D04/G01–G04/G06: scoped local/protocol/engine evidence PASS; actual hosted migration, grants/RLS/reader, canonical pgTAP and real owner intake read remain BLOCKED pending activation. D05–D08 and full E content/rights/coverage and hosted operations/release controls remain pending. Assessment/AI/billing are not changed. No ASVS requirement was promoted to verified.

Per AGENTS.md, obtain the separate live-schema instruction for these two new private tables, narrow reader and rollback tests. Data population itself is already requested; once activation is authorized, execute the reviewed setup/chunks/seal and reconcile every stored record/hash, visibility, repeat safety and actual owner view. Preserve every gap and keep all raw records unpublished. Thirteen PDFs/private asset delivery and promotion into reviewed student learning are separate remaining work. No commit, push, deployment, charge or native build.
