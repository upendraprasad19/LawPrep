# Beginner journey concept

Status: throwaway interactive mockup for discussion, not approved production implementation.

## Design direction

- Visual thesis: a calm navy study workspace with warm amber actions and editorial serif headings.
- Content plan: discover law careers, select an exam, choose study time, try a foundation lesson, inspect progress.
- Interaction thesis: quiet screen transitions, clear selection feedback and immediate explanation of practice results; reduced-motion preferences respected.

The navy theme draws on the existing LexCommand prototype. Typography, layout and exact interactions are proposals rather than agreed product requirements.

## What the concept demonstrates

- CLAT is the default product focus. BLET and CUET-PG LLB have selectable paths and different suggested focus/topic labels.
- A daily-time selector changes the sample session allocation.
- A sample assessment is optional.
- A worked example, practice question, hints and corrective explanation demonstrate self-paced teaching.
- Coverage, practice evidence and retention are separate. One correct answer never establishes mastery or exam readiness.
- Explore, Prepare and AI Guide are shown without fixed prices.
- AI responses are scripted. No provider, live AI, accounts, payments or database is connected.
- Career descriptions and syllabus examples are illustrative. This is not a published exam guide or eligibility assessment.
- State is temporary and resets on page reload. This concept does not implement saved learning accounts.

## Files and viewing

The latest screen is `.superpowers/brainstorm/1813-1792164911/content/beginner-journey-v2.html`.

It can be opened as a standalone HTML file or served through the brainstorming companion. The companion injects its local interaction recorder. Do not include `.superpowers/` session files in a future public repository: they contain local server metadata and session access keys.

Preview images are in `output/playwright/`.

## Verification

Checked in the Codex browser:

- BLET selection, lesson coverage, correct practice answer and resulting progress evidence.
- CUET-PG LLB selection, sample assessment, distinct reasoning lesson and progress.
- AI hint preview and the three-tier comparison dialog.
- Desktop layout at 1440 pixels and mobile layouts at 390 and 320 pixels; no document-level horizontal overflow in the inspected views.
- No captured browser console errors during the inspected flow.
- JavaScript parses successfully in Node.

No production build, dependency installation, commit, push or publication was performed.

## Feedback to collect

Does the sequence help a complete beginner choose a direction and begin learning? Consider information order, clarity, teaching readability and the distinction between coverage and understanding before choosing final styling.
