# Law Prep LMS — Design Specification

**Date:** 2026-07-23
**Status:** Approved — ready for implementation
**Project:** `github.com/upendraprasad19/LawPrep`
**Target:** Vercel deployment, auto-generated `.vercel.app` URL

---

## 1. Product Vision

A self-study Learning Management System for Indian law entrance exams (CLAT 2027, CUET-PG LLB, BLET/Patna Law College). The user's existing content (1000+ questions, 30 lessons, 5 flashcard decks, 3 mock blueprints) moves from a single-file HTML app (`LexCommand.html`) into a multi-user, database-backed platform with progress tracking, analytics, and spaced repetition.

**Primary user:** Single aspirant (Upen) — but architected for multi-user from day one.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router, TypeScript) | Best Vercel integration, server components, API routes |
| Styling | Tailwind CSS | Utility-first, dark mode native, small bundle |
| Auth | Supabase Auth (email + Google OAuth) | Built-in, serverless, free tier generous |
| Database | Supabase (PostgreSQL) | Same platform as auth, realtime, RLS |
| Content | Markdown → HTML at Next.js layer | MDX/Markdown stored in DB, rendered via `next-mdx-remote` |
| Deployment | Vercel (GitHub → auto-deploy) | Zero-config, preview deployments, edge functions |

---

## 3. Visual Design System

### Theme (Research-Backed)
- **Default: Dark navy** (`#0a0e1a` from LexCommand.html)
  - Lowers perceived workload (NASA-TLX) for long study sessions
  - Blue sustains long-term attention (Xu et al. 2025)
  - Differentiates from generic light-theme ed-tech
- **Light mode toggle** — user-controlled (Ahmad et al. 2026)
- **Functional color coding** (not decorative):
  - CLAT = Blue (`#6ea8fe`) — trust, focus
  - CUET = Purple (`#c98cff`) — ambition
  - BLET = Green (`#4fd1a5`) — growth, primary target
  - Gold/amber (`#f5c451`) — achievements, highlights

### Layout Principles
- Modular content blocks (reduces cognitive load)
- Hick's Law: ≤4 primary actions per screen
- Fitts' Law: large tap targets for mobile
- Progress visibility: streak, mastery bars, score trends always visible

---

## 4. Information Architecture

### Public Routes
```
/                    → Landing page
/auth/login          → Sign in
/auth/signup         → Sign up
/auth/callback       → OAuth callback
```

### Authenticated Routes (protected)
```
/dashboard           → Command Center (default)
/learn               → Subjects grid
/learn/[subject]     → Lesson list
/learn/[subject]/[lesson] → Lesson reader (MDX)
/drill               → Quick practice builder
/mock/[exam]         → Full mock exam (CLAT/CUET/BLET)
/arena               → Mock history + analytics
/recall              → Flashcard decks + spaced repetition
/current-affairs     → Monthly CA + quiz
/syllabus            → Visual tracker by exam/section/topic
/profile             → Targets, settings, achievements
```

### Navigation (persistent sidebar, collapsed on mobile)
```
◎  Command Center
▤  Learn
◈  Drill
▶  Full Mocks
◉  Mock Arena
⚡  Recall
◍  Current Affairs
☰  Syllabus Tracker
⛃  Profile
```

---

## 5. Screen Designs

### 5.1 Landing Page (`/`)
- Hero: "Law Prep OS — One engine, three exams"
- Feature cards: Dashboard, Mock Tests, Spaced Repetition, Analytics
- Social proof: "Built from a topper's study system"
- CTA: "Start Free" → `/auth/signup`

### 5.2 Dashboard (`/dashboard`) — Command Center
```
┌──────────────────────────────────────────────────────┐
│  [§ Lex Command]              Phase: Stage 1  [👤]    │
├──────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ CLAT 2027 │ │ CUET-PG  │ │ BLET     │              │
│  │  136 days │ │  235 d   │ │  266 d   │              │
│  │  ████░░░  │ │  ██░░░░░ │ │  █░░░░░░ │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ 12   │ │ 72%  │ │ 5 🔥 │ │ 23   │                 │
│  │Mocks │ │Avg   │ │Streak│ │Due   │                 │
│  └──────┘ └──────┘ └──────┘ └──────┘                 │
│                                                        │
│  ┌──────────────────┐ ┌──────────────────┐             │
│  │ ▶ Full Mock      │ │ ▤ Learn          │             │
│  │ Start a timed    │ │ Browse lessons   │             │
│  │ CLAT/CUET/BLET   │ │ by subject       │             │
│  ├──────────────────┤ ├──────────────────┤             │
│  │ ◈ Quick Drill    │ │ ◍ Current Aff.  │             │
│  │ Section practice │ │ This month's CA  │             │
│  └──────────────────┘ └──────────────────┘             │
│                                                        │
│  ┌──────────────────────┐ ┌──────────────────────┐     │
│  │ Today's Mission      │ │ Overall Readiness     │     │
│  │ ☑ Read editorial     │ │ CLAT ████████░░ 80%   │     │
│  │ ☐ 30 MCQs drill      │ │ CUET ██████░░░░ 60%   │     │
│  │ ☐ Legal practice     │ │ BLET ████░░░░░░ 40%   │     │
│  │ ☐ Flashcards review  │ │                      │     │
│  └──────────────────────┘ └──────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

### 5.3 Learn (`/learn`, `/learn/[subject]`, `/learn/[subject]/[lesson]`)
- Subject cards grid → progress bar → lesson list (numbered, checkmarks)
- Lesson reader: breadcrumb, MDX content, [Practise this] → Drill, [Mark as read]

### 5.4 Drill (`/drill`)
- Builder: Section, Exam, Difficulty, Questions count, Timer
- Session: same engine as mock but lighter, immediate results

### 5.5 Full Mock (`/mock/[exam]`)
- Pre-screen: Exam selector, duration, marking scheme, [Start]
- Test screen: timer, question palette (green=answered, amber=flagged), passage, options, nav
- Post-submit: Score card + sectional breakdown + review with explanations

### 5.6 Mock Arena (`/arena`)
- KPI cards: mocks completed, avg accuracy, trend
- Weak sections (accuracy < 60%)
- Score trend line chart
- Mock history table with detail links

### 5.7 Flashcards (`/recall`)
- Deck cards: name, card count, due count
- Review mode: spaced repetition (SM-2), 4-button rating (Again/Hard/Good/Easy)

### 5.8 Current Affairs (`/current-affairs`)
- Monthly tabs (Jan 2026 → present)
- Rendered markdown sections (National, Legal, International, Economy, Awards, Sports)
- Quiz mode: CA-tagged questions from bank

### 5.9 Syllabus (`/syllabus`)
- 3 exam tabs (CLAT/CUET/BLET)
- Section cards with topic lists + mastery dots (0-4)

### 5.10 Profile (`/profile`)
- Exam targets (CLAT/CUET/BLET checkboxes + date pickers)
- Daily hours setting
- Theme toggle (dark/light)
- Achievements/badges
- Export/import data

---

## 6. Database Schema (23 Tables)

### 6.1 Core Content (6 tables)

```sql
-- 1. subjects
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  exam text NOT NULL CHECK (exam IN ('clat','cuet','blet','shared')),
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. topics
CREATE TABLE topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  "order" int DEFAULT 0,
  UNIQUE(subject_id, slug)
);

-- 3. lessons
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  "order" int NOT NULL,
  content_markdown text NOT NULL,
  words int DEFAULT 0,
  exam text NOT NULL,
  practice_section text,
  created_at timestamptz DEFAULT now()
);

-- 4. questions
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam text NOT NULL CHECK (exam IN ('clat','cuet','blet','shared')),
  section text NOT NULL,
  topic text,
  difficulty text CHECK (difficulty IN ('easy','medium','hard')),
  passage text,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer int NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  explanation text,
  source text,
  verify boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_questions_exam_section ON questions(exam, section);

-- 5. flashcard_decks
CREATE TABLE flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  "order" int DEFAULT 0
);

-- 6. flashcards
CREATE TABLE flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  "order" int DEFAULT 0
);
```

### 6.2 Mock System (4 tables)

```sql
-- 7. mock_definitions
CREATE TABLE mock_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam text NOT NULL CHECK (exam IN ('clat','cuet','blet')),
  name text NOT NULL,
  duration_minutes int NOT NULL,
  total_questions int NOT NULL,
  mark_correct numeric NOT NULL,
  mark_wrong numeric NOT NULL,
  negative_marking boolean NOT NULL
);

-- 8. mock_sections
CREATE TABLE mock_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_id uuid REFERENCES mock_definitions(id) ON DELETE CASCADE,
  label text NOT NULL,
  question_count int NOT NULL,
  section_filters jsonb NOT NULL,
  "order" int DEFAULT 0
);

-- 9. past_papers
CREATE TABLE past_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam text NOT NULL,
  year int NOT NULL,
  name text NOT NULL,
  source text,
  pdf_url text,
  "order" int DEFAULT 0
);

-- 10. current_affairs
CREATE TABLE current_affairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  content_markdown text NOT NULL,
  "order" int DEFAULT 0
);
CREATE UNIQUE INDEX idx_ca_month_category ON current_affairs(month, category, "order");
```

### 6.3 User Progress (11 tables)

```sql
-- 11. profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  exam_targets text[] DEFAULT '{}',
  daily_study_hours int DEFAULT 5,
  theme text DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  created_at timestamptz DEFAULT now()
);

-- 12. exam_configs (per-user exam dates)
CREATE TABLE exam_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  exam text NOT NULL CHECK (exam IN ('clat','cuet','blet')),
  exam_date date NOT NULL,
  UNIQUE(user_id, exam)
);

-- 13. section_aliases (maps naming across sources)
CREATE TABLE section_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  alias text NOT NULL,
  source text NOT NULL,
  UNIQUE(canonical_name, alias, source)
);

-- 14. user_lesson_progress
CREATE TABLE user_lesson_progress (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  read boolean DEFAULT true,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- 15. user_topic_mastery
CREATE TABLE user_topic_mastery (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  mastery_level int DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 4),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

-- 16. user_mock_results
CREATE TABLE user_mock_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  mock_def_id uuid REFERENCES mock_definitions(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  max_score numeric NOT NULL,
  correct int NOT NULL,
  wrong int NOT NULL,
  attempted int NOT NULL,
  accuracy_pct numeric NOT NULL,
  sectional_data jsonb NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL
);
CREATE INDEX idx_user_mock_results_user ON user_mock_results(user_id);

-- 17. user_mock_answers (with question snapshot)
CREATE TABLE user_mock_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid REFERENCES user_mock_results(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer int,
  correct boolean NOT NULL,
  time_spent_sec int,
  question_snapshot jsonb NOT NULL,
  UNIQUE(result_id, question_id)
);

-- 18. user_flashcard_reviews (SM-2 algorithm)
CREATE TABLE user_flashcard_reviews (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  flashcard_id uuid REFERENCES flashcards(id) ON DELETE CASCADE,
  ease_factor numeric DEFAULT 2.5 CHECK (ease_factor BETWEEN 1.3 AND 2.5),
  interval_days int DEFAULT 0,
  next_review_at timestamptz NOT NULL,
  last_reviewed_at timestamptz,
  PRIMARY KEY (user_id, flashcard_id)
);
CREATE INDEX idx_flashcard_reviews_due ON user_flashcard_reviews(user_id, next_review_at);

-- 19. user_daily_logs
CREATE TABLE user_daily_logs (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  tasks_completed text[] DEFAULT '{}',
  PRIMARY KEY (user_id, log_date)
);

-- 20. user_custom_cards
CREATE TABLE user_custom_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  deck_id uuid REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 21. user_custom_questions
CREATE TABLE user_custom_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  exam text,
  section text,
  topic text,
  difficulty text,
  passage text,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer int NOT NULL,
  explanation text,
  created_at timestamptz DEFAULT now()
);

-- 22. achievements
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  criteria jsonb NOT NULL,
  "order" int DEFAULT 0
);

-- 23. user_achievements
CREATE TABLE user_achievements (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
```

---

## 7. Row Level Security (RLS) Policies

```sql
-- User tables: users can only read/write their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE exam_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exam configs" ON exam_configs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lesson progress" ON user_lesson_progress FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own topic mastery" ON user_topic_mastery FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_mock_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mock results" ON user_mock_results FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_mock_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mock answers" ON user_mock_answers FOR ALL USING (auth.uid() = result_id IN (SELECT id FROM user_mock_results WHERE user_id = auth.uid()));

ALTER TABLE user_flashcard_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own flashcard reviews" ON user_flashcard_reviews FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily logs" ON user_daily_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_custom_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own custom cards" ON user_custom_cards FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_custom_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own custom questions" ON user_custom_questions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Content tables: PUBLIC READ ONLY
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read subjects" ON subjects FOR SELECT USING (true);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read topics" ON topics FOR SELECT USING (true);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read lessons" ON lessons FOR SELECT USING (true);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read questions" ON questions FOR SELECT USING (true);

ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read decks" ON flashcard_decks FOR SELECT USING (true);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read flashcards" ON flashcards FOR SELECT USING (true);

ALTER TABLE mock_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read mock defs" ON mock_definitions FOR SELECT USING (true);

ALTER TABLE mock_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read mock sections" ON mock_sections FOR SELECT USING (true);

ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read past papers" ON past_papers FOR SELECT USING (true);

ALTER TABLE current_affairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read CA" ON current_affairs FOR SELECT USING (true);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);

ALTER TABLE section_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read aliases" ON section_aliases FOR SELECT USING (true);
```

---

## 8. Data Migration (HIGH PRIORITY)

### Source: `LexCommand.html` embedded JS objects
- `BANK.questions` → `questions` table (~1000+ rows)
- `BANK.lessons` → `lessons` table (~30 rows)
- `BANK.curriculum` → `subjects` + `topics` tables
- `DECKS` → `flashcard_decks` + `flashcards` (5 decks, ~100 cards)
- `BLUEPRINTS` → `mock_definitions` + `mock_sections` (3 mocks)
- `SYLLABUS` → `section_aliases` + topic names
- `PAPER_NAMES` → `past_papers`
- `DAILY_ENGINE` → seed `daily_engine_tasks` (or hardcode)
- `PLAN` → seed `plan_stages` (or hardcode)

### Migration Script Requirements
1. Parse HTML, extract JS objects using regex/AST
2. Transform section names → canonical names via `section_aliases`
3. Bulk insert via Supabase admin client (`service_role` key)
4. Verify counts match source
5. Idempotent (safe to re-run)

**Estimated effort:** 2-3 hours

---

## 9. Seed Data (Static)

### Default Achievements
| Slug | Name | Criteria |
|---|---|---|
| `streak_3` | 3-Day Streak | `{"type": "streak", "value": 3}` |
| `streak_7` | Week Warrior | `{"type": "streak", "value": 7}` |
| `streak_30` | Monthly Master | `{"type": "streak", "value": 30}` |
| `first_mock` | Mock Debut | `{"type": "mock_count", "value": 1}` |
| `clat_80` | CLAT Sharpshooter | `{"type": "mock_accuracy", "exam": "clat", "min": 80}` |
| `cuet_80` | CUET Quant King | `{"type": "mock_accuracy", "exam": "cuet", "min": 80}` |
| `blet_90` | BLET Guesser | `{"type": "mock_accuracy", "exam": "blet", "min": 90}` |
| `flash_100` | Flashcard Century | `{"type": "flashcards_reviewed", "value": 100}` |

### Daily Engine Tasks (hardcoded or seeded)
```js
const DAILY_ENGINE_TASKS = [
  { id: 'd_edit', text: 'Read a Hindu / Indian Express editorial (30 min, active)', tag: 'All' },
  { id: 'd_mcq', text: '20–50 MCQs across sections (use Drill)', tag: 'All' },
  { id: 'd_legal', text: 'Legal reasoning / legal-GK practice set', tag: 'CLAT·BLET' },
  { id: 'd_logic', text: 'Logical / critical reasoning set', tag: 'CLAT·CUET' },
  { id: 'd_ca', text: 'Update Current-Affairs notes for today', tag: 'All' },
  { id: 'd_flash', text: 'Clear today\'s flashcard review queue', tag: 'All' },
  { id: 'd_read', text: '25 min free reading (build RC stamina)', tag: 'CLAT' }
];
```

---

## 10. API Routes (Next.js App Router)

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/callback` | GET | Supabase OAuth callback |
| `/api/mock/start` | POST | Build mock from definition + random sampling |
| `/api/mock/submit` | POST | Grade + persist results + snapshots |
| `/api/drill/start` | POST | Build drill session |
| `/api/drill/submit` | POST | Grade + persist |
| `/api/flashcard/review` | POST | SM-2 update (ease, interval, next_review) |
| `/api/daily/complete` | POST | Mark daily task done, update streak |
| `/api/progress/summary` | GET | Dashboard KPIs (single RPC call) |
| `/api/ca/month` | GET | Rendered CA markdown for month |

---

## 11. Implementation Phases

| Phase | Duration | Deliverable |
|---|---|---|
| **0. Foundation** | 1 session | Repo clone, Next.js scaffold, Supabase project, env vars, schema migration, seed script |
| **1. Auth & Landing** | 1 session | Landing page, login/signup, OAuth, protected route wrapper, profile creation on first sign-in |
| **2. Dashboard** | 1 session | Command Center with 3-exam countdown, KPIs, daily mission, readiness bars |
| **3. Learn + Lessons** | 1 session | Subjects grid, lesson list, MDX reader, mark-as-read, practice button |
| **4. Question Bank Migration** | 1 session | Parse LexCommand.html → seed questions, lessons, subjects, topics, aliases |
| **5. Drill** | 1 session | Builder + session + results |
| **6. Full Mocks** | 1 session | Exam selector, timed test, question palette, auto-grade, review |
| **7. Mock Arena** | 1 session | History, analytics, weak sections, trend chart |
| **8. Flashcards** | 1 session | Deck list, SM-2 review, due queue |
| **9. Current Affairs** | 0.5 session | Monthly tabs + markdown render + CA quiz |
| **10. Syllabus + Profile** | 0.5 session | Visual tracker, exam targets, theme toggle, achievements |
| **11. Polish & Deploy** | 0.5 session | Vercel deploy, RLS verify, seed data, smoke test |

**Total: ~9-10 sessions**

---

## 12. Open TODOs (Implementation Gaps)

| # | Area | TODO |
|---|---|---|
| **T01** | Migration | Write Node script to parse `LexCommand.html` and extract all JS objects (`BANK`, `CURRICULUM`, `DECKS`, `BLUEPRINTS`, `SYLLABUS`, `PAPER_NAMES`, `DAILY_ENGINE`, `PLAN`) |
| **T02** | Migration | Transform section names → canonical via `section_aliases` mapping table |
| **T03** | RLS | Apply all 23 RLS policies via Supabase SQL editor before any user signs up |
| **T04** | Onboarding | Design 3-step wizard: (1) Select target exams, (2) Set exam dates, (3) Set daily hours |
| **T05** | Question Versioning | `user_mock_answers.question_snapshot` stores full question at attempt time |
| **T06** | CA Content | Create `current_affairs` seed data from `Current_Affairs_Starter.md` |
| **T07** | Admin Content | Decide: seed scripts only, admin API routes, or Supabase dashboard |
| **T08** | Search | Add `/api/search` endpoint for global search |
| **T09** | Accessibility | Verify WCAG AA contrast on navy theme, add focus indicators, ARIA labels |
| **T10** | Empty States | First-time user: guided tour, sample mock, "read your first lesson" prompt |
| **T11** | Error Boundaries | React error boundaries for mock test, lesson reader |
| **T12** | Offline Indicator | Show banner when Supabase unreachable |

---

## 13. Acceptance Criteria

- [ ] Landing page loads, "Start Free" → signup → dashboard
- [ ] Google OAuth + email/password both work
- [ ] Dashboard shows 3 exam countdowns, streak, KPIs, daily mission
- [ ] Learn: subjects → lessons → reader with markdown render
- [ ] Drill: build → practice → results with sectional breakdown
- [ ] Full Mock: CLAT/CUET/BLET each works, timed, palette, review
- [ ] Mock Arena: history table, trend chart, weak sections
- [ ] Flashcards: decks → SM-2 review, due queue persists
- [ ] Current Affairs: monthly tabs render markdown, quiz works
- [ ] Syllabus: 3 exams, sections, topics, mastery dots
- [ ] Profile: exam targets, dates, theme toggle, achievements
- [ ] All user data isolated via RLS (test with 2 accounts)
- [ ] Deployed on Vercel, accessible at `*.vercel.app`
- [ ] Migration script runs idempotently, seeds all content

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Migration script fails on embedded HTML parsing | Medium | High | Test extract on copy first; use `cheerio` + regex for JS object extraction |
| RLS blocks legitimate queries | Medium | High | Test with 2 test users in Supabase dashboard before deploy |
| Mock question sampling too slow | Low | Medium | Index on `(exam, section)`; use `TABLESAMPLE SYSTEM` for large pools |
| SM-2 algorithm edge cases | Low | Medium | Port existing LexCommand.js logic (already working) |
| Vercel cold starts on API routes | Low | Low | Use edge runtime for auth callback; keep others Node |

---

**End of Specification**