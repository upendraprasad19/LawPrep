# Source inventory and production ledger

Audit performed 24 October 2026. Run `npm run content:audit` to regenerate the private draft import and the metadata-only inventory. The extractor parses literals with the TypeScript AST; it never evaluates the prototype. Unsupported syntax/initializers and malformed records are reported explicitly.

## Existing material

| Material | Extracted | Publication status |
| --- | ---: | --- |
| Questions | 1,203 | Draft, rights/source/answer review required |
| Lessons | 41 | Draft; no original IDs on these records |
| Curriculum entries | 65 | Draft; embedded HTML remains inert import data |
| Legacy deck structures | 4 | Draft configuration; this is not a flashcard count |
| Past-paper PDFs | 13 | Hash/header/size inventory only; authenticity and rights unverified |

The historical question/lesson/curriculum/PDF counts agree with the current extraction. Additional deck structures are counted separately. `BLUEPRINTS` contains executable arrow functions and is intentionally not evaluated or silently counted as extracted content. Its unsupported status appears in the inventory.

There are **492 questions without explanations**, **65 original verification flags**, no duplicate question IDs and no exact normalized question/passage/option duplicates under the current detector. This detector does not establish semantic uniqueness or independent question families. The verification flags do not confer editorial approval. All **196 legacy exam/subject/topic labels** still require canonical mapping; label count is not syllabus coverage.

Original source SHA-256: `7dec12fd788d018298c15e8b5717667f540361680373579782816ab807f882cf`. Re-running the audit verifies that source bytes and modification time stay unchanged. PDF filenames containing “official”, “unofficial” or “memory based” are claims, not authenticity checks. The report distinguishes explicit memory/unofficial filename claims; unidentified papers remain unverified, including analogue-practice material.

The four `PU2024`/`PU2025` question/key files are restricted to **analogue-only** use by byte-bound annotations. The supplied download checklist identifies Panjab University papers as analogues, and the inspected 2024 key explicitly names Panjab University, Chandigarh. These files must not be presented as Patna BLET papers. Their pairing/authenticity/rights still require review; changing file bytes removes the annotation rather than transferring it to new material based on its name.

`content/imports/legacy-draft.json` includes answer/explanation data and is ignored by Git. Neither it nor the prototype/PDFs is staged into the public website. `content/editorial/inventory.json` contains provenance and issue metadata without question text or answers. Rendering imported HTML safely and publishing immutable versions belong to the next catalog task.

## Exam source verification

- **CLAT UG:** the [official 2027 syllabus](https://clat2027.consortiumofnlus.ac.in/clat-2027/ug-syllabus.html) supports the draft teaching-topic decomposition in `content/coverage/clat-ug.json`. These are editorial groupings, not official chapter weights or a published course.
- **CUET-PG LLB:** checked NTA’s [COQP11 syllabus](https://cdnbbsr.s3waas.gov.in/s388a839f2f6f1427879fc33ee4acf4f66/uploads/2025/12/202512131769837174.pdf) and [Delhi University’s 2026 mapping](https://cdnbbsr.s3waas.gov.in/s388a839f2f6f1427879fc33ee4acf4f66/uploads/2025/12/20251215190434483.pdf), page 13, which maps LL.B. to COQP11. This is a 2026 reference; next-cycle and other-institution mappings remain unverified.
- **BLET, Patna three-year LLB:** inspected the [university admission portal](https://pup.ac.in/AdmissionPortal2026.aspx) and its scanned [LL.B.(H) notice](https://pup.ac.in/UploadFile/2026/Jun/12-Jun-2026/NoticeBoard/New%20Doc%2006-12-2026%2011.58.pdf). The notices retrieved do not supply a current entrance syllabus. The BLET topic ledger therefore stays empty with an explicit blocker. Do not turn secondary-source or legacy pattern claims into authoritative exam rules.

## Required production work

Each listed CLAT/CUET teaching topic requires one teaching unit, one worked example, one guided-practice set, one fresh-practice set, one revision set and one assessment pool. These are specific production work items, **not a claim that one set is sufficient preparation**. Per-set item counts, topic boundaries, distinct families, progression and full mock assembly need editorial acceptance before any completeness gate can pass.

The row reviewer is the pending owner/editor role; it is not a fictitious completed human review. Existing usable **published assets: zero**. Legacy candidates must be mapped and checked for explanation correctness, ambiguity, source/rights, exam fit, accessibility and safe rendering. Missing explanations need authored replacements or withdrawal. Owner-controlled review is separate from the excluded human-mentorship product.

No complete-preparation claim is permitted for any route at this stage. BLET scope and future CUET cycles remain explicit source blockers; all imported rights remain unknown. Software import success does not imply educational or release readiness.

31 October continuation: the owner-approved [private intake and owner library](private-intake.md) now contains the complete structured collection in development Supabase. It preserves original records without forcing incomplete questions, local source documents or curriculum/deck containers into canonical published-content shapes. Actual hosted reconciliation matched all 1,313 prepared record hashes and UTF-8 byte lengths with zero mismatches; the local engine separately matched each full original text/hash. Thirty hosted permission/integrity assertions, negative control and test cleanup passed. No student content has been published, and PDF/private asset upload remains separate.
