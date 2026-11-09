# Private legacy collection intake

Activated 31 October 2026 as a Task 3 continuation, after the owner explicitly approved the private database update, temporary tests and population. Migration `20261031015636_legacy_intake.sql` is applied and the complete 1,313-record collection is loaded into the dedicated development project. Every stored record's hash and UTF-8 byte length matched its original preparation, with zero mismatches. No imported record is published or represented as verified content.

## Collection and provenance

The current extraction contains 1,203 questions, 41 lessons, 65 curriculum entries and four deck structures: 1,313 original records. Exactly 492 questions lack explanations. Preserve those empty values, original exam/subject labels, source indices, nullable IDs, HTML strings, legacy verification flags and extraction errors. Executable BLUEPRINTS remains explicitly unsupported; thirteen PDF assets remain separately inventoried, not uploaded or silently converted to questions by this structured intake.

`prepare-legacy-intake.ts` regenerates the extraction from the unchanged `LexCommand.html` and rejects any mismatch with the stored private JSON, including added approval fields or altered answers. Original source SHA256, exact extracted-file SHA256 and per-record JSON-text SHA256 are distinct. An ordered aggregate of the record hashes seals the complete record set. The operator files live in the ignored task ledger; neither original answers nor prepared SQL become public assets.

## Storage and review

The CLI-generated migration adds only private `import_batches` and `import_records`, immutable original provenance/records, a validated loading-to-complete transition and a publisher-only reader. There are no direct application table grants, intake write RPC, automatic publication, fabricated explanation or placeholder verified cycle. Record insertion and completion lock the same batch row; completed batches reject appends. Partial loads remain hidden and can resume with identical rows. Changed reuse is rejected rather than overwritten.

The owner’s Imported library shows original kinds, counts, missing explanations, source errors and unknown rights, with filtered/paginated lists and original payload inspection. Batch identity is pinned during browsing and required for record detail. Original HTML is rendered as inert text. The live confirmed publisher/session helper guards the RPC; HTTP uses bearer authorization and private/no-store responses. Authentication changes cancel requests and clear private screens. The reader does not add items to student exam routes.

To become student learning material, a record still needs genuine source/rights work, verified exam mapping, completed explanation and editorial review, followed by the existing canonical versioned publishing command. This intake does not turn curriculum entries into teaching units or deck containers into a validated flashcard library. No completion, mastery, course coverage or production-readiness claim follows from record counts.

## Operator sequence

1. Verify the dedicated project and approved publisher/live session; inspect current intake state. Generate files with `LAWPREP_IMPORT_OWNER_EMAIL` supplied in the local environment; preparation performs no external writes.
2. Obtain the required hosted-schema activation instruction for any future migration. The current update was explicitly approved and applied; the provider assigned version `20261031015636`, replacing the local preparation timestamp `20261030181714` without changing reviewed SQL bytes. Actual public types were regenerated and the anticipated `database.pending.ts` bridge removed. Do not reapply the historical preparation filename or request repeat approval for this completed activation.
3. Run canonical rollback-only database tests and a deliberately failing control, then verify cleanup. This does not authenticate synthetic SQL fixtures through GoTrue.
4. Execute setup, the 33 prepared chunks and seal for the current collection. Each operation verifies the approved live publisher and uses a batch advisory lock; record/parent locks protect completion. Every existing record must match its exact prepared text, metadata and hash. No active canonical content is modified.
5. Reconcile actual hosted counts, all exact record texts/digests, manifest/seal and no unreviewed public catalogue effects; verify the real owner UI reads and displays the loaded collection. Test exact replay without duplicate rows. Record actual results rather than treating prepared commands as proof.

Actual hosted PostgreSQL tests passed all 30 canonical assertions, both before and after population. The deliberate extra failing assertion was rejected. A post-load regression exposed an initial test assumption that the whole library would be empty while a fixture batch loaded; the test now explicitly checks that the loading batch is unavailable while an existing completed batch remains available. Synthetic test rows/users/temp relation and pgTAP were rolled back. All 35 reviewed load operations completed; setup, the first data chunk and seal were replayed exactly without duplicate records. This is a sampled hosted replay, alongside the complete local replay and full hosted reconciliation.

The real authenticated owner library loaded all counts and supports paging/filtering and original-record inspection. Anonymous local API/direct Data API reads are denied, and public catalogues exclude the raw collection. Current status and final verification limits are recorded in the [activation review](../engineering/reviews/legacy-intake-activation.md).

Local PGlite/PostgreSQL 18 preflight also roundtripped every original record and digest and preserved missing values, with hidden partial loads, replay, mutation rejection and revoked-session checks. A hostile dollar-delimiter source string failed the original loader before the delimiter fix, then roundtripped safely afterward. This remains supplemental engine evidence, not clean Supabase replay, Storage, production delivery or simultaneous-connection proof.
