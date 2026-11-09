# Law Prep LMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Learning Management System for Indian law entrance exams, migrating 1000+ questions from LexCommand.html into a Next.js + Supabase app with auth, progress tracking, mock tests, flashcards, and analytics.

**Architecture:** Next.js 14 App Router + Tailwind CSS frontend, Supabase (PostgreSQL + Auth) backend. Markdown content rendered at the Next.js layer. Vercel deployment from GitHub.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL), next-mdx-remote, recharts (for charts), sm2 (spaced repetition)

---

## File Structure

```
LawPrep/
├── .env.local                          # Supabase env vars
├── .env.example                        # Template for env vars
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── scripts/
│   ├── migrate-lexcommand.ts           # Extract data from LexCommand.html
│   ├── seed-supabase.ts                # Seed Supabase with extracted data
│   └── reset-db.ts                     # Drop + recreate schema
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # All 23 tables + RLS
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout: sidebar + providers
│   │   ├── page.tsx                    # Landing page (public)
│   │   ├── globals.css                 # Tailwind + theme vars
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts       # OAuth callback handler
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar wrapper for all auth'd routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── learn/page.tsx
│   │   │   ├── learn/[subject]/page.tsx
│   │   │   ├── learn/[subject]/[lesson]/page.tsx
│   │   │   ├── drill/page.tsx
│   │   │   ├── mock/[exam]/page.tsx
│   │   │   ├── arena/page.tsx
│   │   │   ├── recall/page.tsx
│   │   │   ├── current-affairs/page.tsx
│   │   │   ├── syllabus/page.tsx
│   │   │   └── profile/page.tsx
│   │   └── api/
│   │       ├── auth/callback/route.ts
│   │       ├── mock/start/route.ts
│   │       ├── mock/submit/route.ts
│   │       ├── drill/start/route.ts
│   │       ├── drill/submit/route.ts
│   │       ├── flashcard/review/route.ts
│   │       ├── daily/complete/route.ts
│   │       └── progress/summary/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── dashboard/
│   │   │   ├── ExamCountdown.tsx
│   │   │   ├── StatsRow.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── DailyMission.tsx
│   │   │   └── ReadinessBars.tsx
│   │   ├── learn/
│   │   │   ├── SubjectCard.tsx
│   │   │   ├── LessonList.tsx
│   │   │   └── LessonReader.tsx
│   │   ├── drill/
│   │   │   ├── DrillBuilder.tsx
│   │   │   ├── DrillSession.tsx
│   │   │   └── DrillResults.tsx
│   │   ├── mock/
│   │   │   ├── MockSelector.tsx
│   │   │   ├── MockSession.tsx
│   │   │   ├── MockResult.tsx
│   │   │   └── MockReview.tsx
│   │   ├── arena/
│   │   │   ├── ArenaKPIs.tsx
│   │   │   ├── WeakSections.tsx
│   │   │   └── MockHistory.tsx
│   │   ├── recall/
│   │   │   ├── DeckList.tsx
│   │   │   └── FlashcardReview.tsx
│   │   ├── ca/
│   │   │   └── CARenderer.tsx
│   │   ├── syllabus/
│   │   │   ├── ExamTabs.tsx
│   │   │   └── MasteryDots.tsx
│   │   ├── profile/
│   │   │   ├── ExamTargets.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── Achievements.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── Badge.tsx
│   │       └── Timer.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # createBrowserClient()
│   │   │   ├── server.ts               # createServerClient()
│   │   │   └── middleware.ts           # Auth middleware
│   │   ├── sm2.ts                      # SM-2 algorithm
│   │   ├── scoring.ts                  # Mock scoring logic
│   │   └── constants.ts                # Exam configs, daily tasks
│   └── types/
│       └── index.ts                    # All TypeScript types
├── tests/
│   ├── api/
│   │   ├── mock-start.test.ts
│   │   └── mock-submit.test.ts
│   └── lib/
│       ├── sm2.test.ts
│       └── scoring.test.ts
└── public/
    └── favicon.ico
```

---

## Phase 0: Foundation (Session 1)

### Task 0.1: Clone Repo & Scaffold Next.js

- [ ] **Step 1: Clone the repository**

```bash
cd "C:\Upendra\Claude Code"
git clone https://github.com/upendraprasad19/LawPrep.git
cd LawPrep
```

- [ ] **Step 2: Scaffold Next.js 14 with TypeScript + Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select: Yes to app router, Yes to src directory, Yes to import alias, No to turbopack.

- [ ] **Step 3: Install core dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr next-mdx-remote gray-matter recharts lucide-react
npm install -D @types/node
```

- [ ] **Step 4: Verify scaffold works**

```bash
npm run dev
```

Expected: App loads at `http://localhost:3000` with default Next.js page.

- [ ] **Step 5: Create `.env.example`**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js 14 with Tailwind + Supabase deps"
```

---

### Task 0.2: Set Up Supabase Project

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New Project → name: `law-prep-lms`, region: closest to India.

- [ ] **Step 2: Copy API keys**

Go to Project Settings → API → copy `Project URL`, `anon` key, `service_role` key.

- [ ] **Step 3: Create `.env.local`**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] **Step 4: Enable email auth**

Go to Authentication → Providers → Email: Enable. Set "Confirm email" to false for dev.

- [ ] **Step 5: Enable Google OAuth (optional, can do later)**

Go to Authentication → Providers → Google: Enable. Add Client ID + Secret.

- [ ] **Step 6: Commit `.env.example` only**

```bash
git add .env.example
git commit -m "chore: add env template"
```

**DO NOT commit `.env.local` — it's in `.gitignore` by default.**

---

### Task 0.3: Create Schema Migration

- [ ] **Step 1: Create migration directory**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Write the full schema SQL**

Create `supabase/migrations/001_initial_schema.sql` with all 23 tables and RLS policies from the spec (Section 6 + Section 7 of design doc).

- [ ] **Step 3: Run migration in Supabase SQL Editor**

Go to Supabase Dashboard → SQL Editor → paste the full SQL → Run.

- [ ] **Step 4: Verify tables created**

Go to Table Editor → verify all 23 tables exist with correct columns.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add initial schema with 23 tables + RLS policies"
```

---

### Task 0.4: Supabase Client Setup

- [ ] **Step 1: Create browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create auth middleware**

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login (except public routes)
  const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route)

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

- [ ] **Step 4: Add middleware to `next.config.js`**

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow markdown rendering from supabase
  experimental: {
    serverComponentsExternalPackages: ['gray-matter'],
  },
}

module.exports = nextConfig
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/ next.config.js
git commit -m "feat: add Supabase client setup + auth middleware"
```

---

### Task 0.5: TypeScript Types

- [ ] **Step 1: Create types file**

Create `src/types/index.ts`:

```typescript
export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  exam_targets: string[]
  daily_study_hours: number
  theme: 'dark' | 'light'
  created_at: string
}

export interface Subject {
  id: string
  name: string
  slug: string
  icon: string | null
  exam: 'clat' | 'cuet' | 'blet' | 'shared'
  order: number
  created_at: string
}

export interface Topic {
  id: string
  subject_id: string
  name: string
  slug: string
  order: number
}

export interface Lesson {
  id: string
  subject_id: string
  title: string
  order: number
  content_markdown: string
  words: number
  exam: string
  practice_section: string | null
  created_at: string
}

export interface Question {
  id: string
  exam: 'clat' | 'cuet' | 'blet' | 'shared'
  section: string
  topic: string | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  passage: string | null
  question_text: string
  options: string[]
  correct_answer: number
  explanation: string | null
  source: string | null
  verify: boolean
  created_at: string
}

export interface FlashcardDeck {
  id: string
  name: string
  slug: string
  description: string | null
  order: number
}

export interface Flashcard {
  id: string
  deck_id: string
  front: string
  back: string
  order: number
}

export interface MockDefinition {
  id: string
  exam: 'clat' | 'cuet' | 'blet'
  name: string
  duration_minutes: number
  total_questions: number
  mark_correct: number
  mark_wrong: number
  negative_marking: boolean
}

export interface MockSection {
  id: string
  mock_id: string
  label: string
  question_count: number
  section_filters: {
    include: string[]
    exclude_exam?: string
  }
  order: number
}

export interface UserMockResult {
  id: string
  user_id: string
  mock_def_id: string
  score: number
  max_score: number
  correct: number
  wrong: number
  attempted: number
  accuracy_pct: number
  sectional_data: Record<string, { correct: number; total: number; accuracy: number }>
  started_at: string
  completed_at: string
}

export interface UserMockAnswer {
  id: string
  result_id: string
  question_id: string
  selected_answer: number | null
  correct: boolean
  time_spent_sec: number | null
  question_snapshot: {
    passage: string | null
    question_text: string
    options: string[]
    correct_answer: number
    explanation: string | null
  }
}

export interface UserFlashcardReview {
  user_id: string
  flashcard_id: string
  ease_factor: number
  interval_days: number
  next_review_at: string
  last_reviewed_at: string | null
}

export interface UserDailyLog {
  user_id: string
  log_date: string
  tasks_completed: string[]
}

export interface ExamConfig {
  id: string
  user_id: string
  exam: 'clat' | 'cuet' | 'blet'
  exam_date: string
}

export interface Achievement {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  criteria: {
    type: string
    value?: number
    exam?: string
    min?: number
  }
  order: number
}

export interface CurrentAffair {
  id: string
  month: string
  category: string
  title: string
  content_markdown: string
  order: number
}

export interface PastPaper {
  id: string
  exam: string
  year: number
  name: string
  source: string | null
  pdf_url: string | null
  order: number
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types for all 23 tables"
```

---

### Task 0.6: Constants & Config

- [ ] **Step 1: Create constants file**

Create `src/lib/constants.ts`:

```typescript
export const EXAMS = {
  clat: {
    id: 'clat',
    name: 'CLAT 2027',
    color: '#6ea8fe',
    date: '2026-12-06',
    note: 'Rigor engine · 120Q · +1/−0.25 · offline',
  },
  cuet: {
    id: 'cuet',
    name: 'CUET-PG LLB',
    color: '#c98cff',
    date: '2027-03-15',
    note: 'DU / BHU · 75Q · +4/−1 · online · Quant-heavy',
  },
  blet: {
    id: 'blet',
    name: 'BLET (Patna)',
    color: '#4fd1a5',
    date: '2027-04-15',
    note: 'Primary target · 100Q · no negative · offline',
  },
} as const

export const EXAM_IDS = ['clat', 'cuet', 'blet'] as const

export const DAILY_ENGINE_TASKS = [
  { id: 'd_edit', text: 'Read a Hindu / Indian Express editorial (30 min, active)', tag: 'All' },
  { id: 'd_mcq', text: '20–50 MCQs across sections (use Drill)', tag: 'All' },
  { id: 'd_legal', text: 'Legal reasoning / legal-GK practice set', tag: 'CLAT·BLET' },
  { id: 'd_logic', text: 'Logical / critical reasoning set', tag: 'CLAT·CUET' },
  { id: 'd_ca', text: 'Update Current-Affairs notes for today', tag: 'All' },
  { id: 'd_flash', text: 'Clear today\'s flashcard review queue', tag: 'All' },
  { id: 'd_read', text: '25 min free reading (build RC stamina)', tag: 'CLAT' },
]

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Command Center', icon: '◎' },
  { href: '/learn', label: 'Learn', icon: '▤' },
  { href: '/drill', label: 'Drill', icon: '◈' },
  { href: '/mock/clat', label: 'Full Mocks', icon: '▶' },
  { href: '/arena', label: 'Mock Arena', icon: '◉' },
  { href: '/recall', label: 'Recall', icon: '⚡' },
  { href: '/current-affairs', label: 'Current Affairs', icon: '◍' },
  { href: '/syllabus', label: 'Syllabus', icon: '☰' },
  { href: '/profile', label: 'Profile', icon: '⛃' },
]

export const ACHIEVEMENTS = [
  { slug: 'streak_3', name: '3-Day Streak', description: 'Complete all daily tasks for 3 consecutive days', icon: '🔥', criteria: { type: 'streak', value: 3 } },
  { slug: 'streak_7', name: 'Week Warrior', description: 'Complete all daily tasks for 7 consecutive days', icon: '⚔️', criteria: { type: 'streak', value: 7 } },
  { slug: 'streak_30', name: 'Monthly Master', description: 'Complete all daily tasks for 30 consecutive days', icon: '👑', criteria: { type: 'streak', value: 30 } },
  { slug: 'first_mock', name: 'Mock Debut', description: 'Complete your first full mock test', icon: '🎯', criteria: { type: 'mock_count', value: 1 } },
  { slug: 'clat_80', name: 'CLAT Sharpshooter', description: 'Score 80%+ in a CLAT mock', icon: '🏹', criteria: { type: 'mock_accuracy', exam: 'clat', min: 80 } },
  { slug: 'cuet_80', name: 'CUET Quant King', description: 'Score 80%+ in a CUET-PG mock', icon: '👑', criteria: { type: 'mock_accuracy', exam: 'cuet', min: 80 } },
  { slug: 'blet_90', name: 'BLET Guesser', description: 'Score 90%+ in a BLET mock (no negative marking!)', icon: '🍀', criteria: { type: 'mock_accuracy', exam: 'blet', min: 90 } },
  { slug: 'flash_100', name: 'Flashcard Century', description: 'Review 100 flashcards', icon: '📚', criteria: { type: 'flashcards_reviewed', value: 100 } },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add exam configs, daily tasks, nav items, achievements"
```

---

## Phase 1: Auth & Landing (Session 2)

### Task 1.1: Landing Page

- [ ] **Step 1: Create landing page**

Replace `src/app/page.tsx`:

```tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#26304a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6ea8fe] to-[#c98cff] flex items-center justify-center font-bold text-[#0a0e1a] text-lg">
            §
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Lex Command</h1>
            <p className="text-[10px] tracking-widest text-[#5b6784] uppercase">Law Prep OS</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 text-sm text-[#8b98b5] hover:text-white transition">
            Sign In
          </Link>
          <Link href="/auth/signup" className="px-4 py-2 text-sm bg-gradient-to-r from-[#6ea8fe] to-[#c98cff] text-[#0a0e1a] rounded-lg font-semibold hover:brightness-110 transition">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 py-24 text-center">
        <h2 className="text-5xl font-bold mb-6">
          Law Prep OS
        </h2>
        <p className="text-xl text-[#8b98b5] mb-4">
          One engine, three exams
        </p>
        <p className="text-[#5b6784] mb-8 max-w-2xl mx-auto">
          CLAT, CUET-PG LLB, and BLET — a complete self-study system with 1000+ questions,
          mock tests, spaced repetition, and analytics. Built from a topper's study system.
        </p>
        <Link href="/auth/signup" className="inline-block px-8 py-3 bg-gradient-to-r from-[#6ea8fe] to-[#c98cff] text-[#0a0e1a] rounded-lg font-bold text-lg hover:brightness-110 transition">
          Start Preparing Free →
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { icon: '▶', title: 'Full Mock Tests', desc: 'CLAT 120Q, CUET 75Q, BLET 100Q — timed, sectioned, auto-scored' },
          { icon: '◈', title: 'Quick Drill', desc: 'Practice by section, topic, or difficulty — untimed or timed' },
          { icon: '⚡', title: 'Spaced Repetition', desc: 'Legal maxims, landmark judgments, articles — SM-2 algorithm' },
          { icon: '◉', title: 'Analytics Dashboard', desc: 'Score trends, weak sections, streak tracking, All India potential' },
        ].map((f, i) => (
          <div key={i} className="bg-[#111828] border border-[#26304a] rounded-xl p-6 hover:border-[#6ea8fe] transition">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-[#8b98b5] text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify landing loads**

```bash
npm run dev
```

Expected: Dark navy landing page with hero, features, nav.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add landing page with hero + features"
```

---

### Task 1.2: Auth Pages (Login + Signup)

- [ ] **Step 1: Create login page**

Create `src/app/auth/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6ea8fe] to-[#c98cff] flex items-center justify-center font-bold text-[#0a0e1a]">§</div>
            <span className="font-bold text-lg text-white">Lex Command</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-[#8b98b5] mt-1">Sign in to continue your prep</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-[#8b98b5] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#26304a] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6ea8fe] transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#8b98b5] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#26304a] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6ea8fe] transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#6ea8fe] to-[#c98cff] text-[#0a0e1a] rounded-lg font-bold hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-[#26304a]"></div>
          <span className="text-[#5b6784] text-sm">or</span>
          <div className="flex-1 h-px bg-[#26304a]"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 bg-[#111828] border border-[#26304a] text-white rounded-lg font-medium hover:border-[#6ea8fe] transition"
        >
          Continue with Google
        </button>

        <p className="text-center text-[#8b98b5] text-sm mt-6">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-[#6ea8fe] hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create signup page**

Create `src/app/auth/signup/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6ea8fe] to-[#c98cff] flex items-center justify-center font-bold text-[#0a0e1a]">§</div>
            <span className="font-bold text-lg text-white">Lex Command</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-[#8b98b5] mt-1">Start your law prep journey</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-[#8b98b5] mb-1">Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#26304a] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6ea8fe] transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#8b98b5] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#26304a] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6ea8fe] transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#8b98b5] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#26304a] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6ea8fe] transition"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#6ea8fe] to-[#c98cff] text-[#0a0e1a] rounded-lg font-bold hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-[#26304a]"></div>
          <span className="text-[#5b6784] text-sm">or</span>
          <div className="flex-1 h-px bg-[#26304a]"></div>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full py-3 bg-[#111828] border border-[#26304a] text-white rounded-lg font-medium hover:border-[#6ea8fe] transition"
        >
          Continue with Google
        </button>

        <p className="text-center text-[#8b98b5] text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#6ea8fe] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create OAuth callback route**

Create `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Create profile if first time
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existing) {
          await supabase.from('profiles').insert({
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
          })
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
```

- [ ] **Step 4: Create API auth callback**

Create `src/app/api/auth/callback/route.ts` (same as above but for API route).

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/
git commit -m "feat: add login, signup, OAuth callback pages"
```

---

### Task 1.3: Profile Creation Hook

- [ ] **Step 1: Create profile creation on first sign-in**

Create `src/lib/supabase/createProfile.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function ensureProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
      })
      .select()
      .single()
    return newProfile
  }

  return profile
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/createProfile.ts
git commit -m "feat: add profile creation on first sign-in"
```

---

## Phase 2: Dashboard (Session 3)

### Task 2.1: Dashboard Layout

- [ ] **Step 1: Create dashboard layout with sidebar**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileNav />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create Sidebar component**

Create `src/components/layout/Sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-56 h-screen bg-gradient-to-b from-[#0c1120] to-[#0a0e1a] border-r border-[#26304a] p-4 sticky top-0 flex flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 mb-6 px-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#6ea8fe] to-[#c98cff] flex items-center justify-center font-bold text-[#0a0e1a] text-sm">
          §
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">Lex Command</h1>
          <p className="text-[9px] tracking-widest text-[#5b6784] uppercase">Law Prep OS</p>
        </div>
      </Link>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-gradient-to-r from-[#6ea8fe]/20 to-[#c98cff]/10 text-white shadow-[inset_2px_0_0_#6ea8fe]'
                : 'text-[#8b98b5] hover:bg-[#111828] hover:text-white'
            }`}
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-[#26304a] pt-4 mt-4">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-sm text-[#8b98b5] hover:text-white hover:bg-[#111828] rounded-lg transition text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create MobileNav component**

Create `src/components/layout/MobileNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'

export function MobileNav() {
  const pathname = usePathname()
  const mobileItems = NAV_ITEMS.slice(0, 5) // First 5 items

  return (
    <nav className="bg-[#111828] border-t border-[#26304a] flex justify-around py-2">
      {mobileItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition ${
            pathname === item.href || pathname.startsWith(item.href + '/')
              ? 'text-[#6ea8fe]'
              : 'text-[#5b6784]'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label.split(' ')[0]}</span>
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/ src/components/layout/
git commit -m "feat: add dashboard layout with sidebar + mobile nav"
```

---

### Task 2.2: Dashboard Page

- [ ] **Step 1: Create dashboard page**

Create `src/app/(dashboard)/dashboard/page.tsx`:

```tsx
import { ExamCountdown } from '@/components/dashboard/ExamCountdown'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { DailyMission } from '@/components/dashboard/DailyMission'
import { ReadinessBars } from '@/components/dashboard/ReadinessBars'

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-[#8b98b5] text-sm">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-[#111828] border border-[#26304a] rounded-full px-4 py-2 text-sm">
          Phase: <span className="text-[#f5c451] font-semibold">Stage 1 — Foundation</span>
        </div>
      </div>

      {/* Exam Countdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ExamCountdown />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsRow />
      </div>

      {/* Quick Actions + Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <QuickActions />
        <DailyMission />
      </div>

      {/* Readiness */}
      <ReadinessBars />
    </div>
  )
}
```

- [ ] **Step 2: Create ExamCountdown component**

Create `src/components/dashboard/ExamCountdown.tsx`:

```tsx
'use client'

import { EXAMS } from '@/lib/constants'

export function ExamCountdown() {
  const today = new Date()

  return (
    <>
      {Object.values(EXAMS).map((exam) => {
        const examDate = new Date(exam.date)
        const days = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        const totalDays = Math.ceil((examDate.getTime() - new Date('2026-07-23').getTime()) / (1000 * 60 * 60 * 24))
        const progress = Math.max(0, Math.min(100, ((totalDays - days) / totalDays) * 100))

        return (
          <div
            key={exam.id}
            className="bg-gradient-to-b from-[#111828] to-[#161f33] border border-[#26304a] rounded-xl p-5"
            style={{ boxShadow: `inset 3px 0 0 ${exam.color}` }}
          >
            <div className="text-xs font-bold tracking-wider uppercase" style={{ color: exam.color }}>
              {exam.name}
            </div>
            <div className="text-5xl font-extrabold my-2" style={{ color: exam.color, fontVariantNumeric: 'tabular-nums' }}>
              {days}
            </div>
            <div className="text-sm text-[#8b98b5]">days to go</div>
            <div className="text-xs text-[#5b6784] mt-2">
              {new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {exam.note}
            </div>
            <div className="h-1.5 bg-[#0c1220] rounded-full mt-3 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: exam.color }}></div>
            </div>
          </div>
        )
      })}
    </>
  )
}
```

- [ ] **Step 3: Create StatsRow component**

Create `src/components/dashboard/StatsRow.tsx`:

```tsx
'use client'

export function StatsRow() {
  // These will be fetched from DB in real implementation
  const stats = [
    { value: '0', label: 'Mocks logged', trend: null },
    { value: '—', label: 'Avg accuracy', trend: null },
    { value: '0🔥', label: 'Daily streak', trend: null },
    { value: '0', label: 'Flashcards due', trend: null },
  ]

  return (
    <>
      {stats.map((stat, i) => (
        <div key={i} className="bg-gradient-to-b from-[#111828] to-[#161f33] border border-[#26304a] rounded-xl p-5">
          <div className="text-3xl font-extrabold" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stat.value}
          </div>
          <div className="text-sm text-[#8b98b5] mt-1">{stat.label}</div>
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 4: Create QuickActions component**

Create `src/components/dashboard/QuickActions.tsx`:

```tsx
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    { href: '/mock/clat', icon: '▶', title: 'Take a Full Mock', desc: 'CLAT 120 · CUET 75 · BLET 100', color: '#6ea8fe' },
    { href: '/learn', icon: '▤', title: 'Learn a Topic', desc: '30+ lessons across 6 subjects', color: '#c98cff' },
    { href: '/drill', icon: '◈', title: 'Quick Drill', desc: '1000+ questions · section or mixed', color: '#4fd1a5' },
    { href: '/current-affairs', icon: '◍', title: 'Current Affairs', desc: 'Jan–Jul 2026 coverage', color: '#f5c451' },
  ]

  return (
    <div className="bg-gradient-to-b from-[#111828] to-[#161f33] border border-[#26304a] rounded-xl p-5">
      <h3 className="font-bold mb-4">Quick Start</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="border border-[#26304a] rounded-xl p-4 hover:border-[#6ea8fe] transition group"
          >
            <div className="text-2xl mb-2" style={{ color: action.color }}>{action.icon}</div>
            <div className="font-semibold text-sm group-hover:text-[#6ea8fe] transition">{action.title}</div>
            <div className="text-xs text-[#5b6784] mt-1">{action.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create DailyMission component**

Create `src/components/dashboard/DailyMission.tsx`:

```tsx
'use client'

import { DAILY_ENGINE_TASKS } from '@/lib/constants'
import { useState } from 'react'

export function DailyMission() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const doneCount = Object.values(completed).filter(Boolean).length

  return (
    <div className="bg-gradient-to-b from-[#111828] to-[#161f33] border border-[#26304a] rounded-xl p-5">
      <h3 className="font-bold mb-4">
        Today's Mission
        <span className="ml-auto text-sm text-[#8b98b5] font-normal">
          {doneCount}/{DAILY_ENGINE_TASKS.length}
        </span>
      </h3>
      <div className="space-y-2">
        {DAILY_ENGINE_TASKS.map((task) => (
          <button
            key={task.id}
            onClick={() => toggle(task.id)}
            className="flex items-start gap-3 w-full text-left py-2 border-b border-[#26304a] last:border-0"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 transition ${
              completed[task.id]
                ? 'bg-[#4fd1a5] border-[#4fd1a5] text-[#0a0e1a]'
                : 'border-[#5b6784]'
            }`}>
              {completed[task.id] && '✓'}
            </div>
            <div>
              <div className={`text-sm ${completed[task.id] ? 'text-[#5b6784] line-through' : ''}`}>
                {task.text}
              </div>
              <div className="text-xs text-[#5b6784]">{task.tag}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create ReadinessBars component**

Create `src/components/dashboard/ReadinessBars.tsx`:

```tsx
'use client'

import { EXAMS } from '@/lib/constants'

export function ReadinessBars() {
  // These will be computed from actual mock data
  const readiness = [
    { exam: 'clat', pct: 0 },
    { exam: 'cuet', pct: 0 },
    { exam: 'blet', pct: 0 },
  ]

  return (
    <div className="bg-gradient-to-b from-[#111828] to-[#161f33] border border-[#26304a] rounded-xl p-5">
      <h3 className="font-bold mb-4">Overall Readiness</h3>
      <div className="space-y-4">
        {readiness.map((r) => {
          const exam = EXAMS[r.exam as keyof typeof EXAMS]
          return (
            <div key={r.exam}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${exam.color}20`, color: exam.color }}>
                  {exam.name}
                </span>
                <span className="text-sm text-[#8b98b5] ml-auto">{r.pct}% mastery</span>
              </div>
              <div className="h-2 bg-[#0c1220] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: `linear-gradient(90deg, ${exam.color}, ${exam.color}88)` }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/ src/components/dashboard/
git commit -m "feat: add dashboard page with countdown, stats, quick actions, daily mission, readiness"
```

---

## Phase 3: Learn (Session 4)

### Task 3.1: Learn Page

- [ ] **Step 1: Create subjects grid page**

Create `src/app/(dashboard)/learn/page.tsx`:

```tsx
import { SubjectCard } from '@/components/learn/SubjectCard'

// This will be fetched from Supabase
const SUBJECTS = [
  { id: '1', name: 'Legal Aptitude', slug: 'legal-aptitude', icon: '⚖', exam: 'shared', lessons: 8, read: 0 },
  { id: '2', name: 'Logical Reasoning', slug: 'logical-reasoning', icon: '🧩', exam: 'shared', lessons: 6, read: 0 },
  { id: '3', name: 'English', slug: 'english', icon: '📖', exam: 'shared', lessons: 5, read: 0 },
  { id: '4', name: 'Quantitative', slug: 'quantitative', icon: '📐', exam: 'shared', lessons: 4, read: 0 },
  { id: '5', name: 'Computer Basics', slug: 'computer-basics', icon: '💻', exam: 'cuet', lessons: 2, read: 0 },
  { id: '6', name: 'Static GK', slug: 'static-gk', icon: '🌐', exam: 'blet', lessons: 5, read: 0 },
]

export default function LearnPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Learn</h1>
      <p className="text-[#8b98b5] text-sm mb-6">
        30+ lessons across 6 subjects. Read the concept, then practise it.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUBJECTS.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SubjectCard component**

Create `src/components/learn/SubjectCard.tsx`:

```tsx
import Link from 'next/link'

interface SubjectCardProps {
  subject: {
    id: string
    name: string
    slug: string
    icon: string
    exam: string
    lessons: number
    read: number
  }
}

export function SubjectCard({ subject }: SubjectCardProps) {
  const pct = subject.lessons > 0 ? Math.round((subject.read / subject.lessons) * 100) : 0

  return (
    <Link href={`/learn/${subject.slug}`} className="block border border-[#26304a] rounded-xl p-5 hover:border-[#6ea8fe] transition group">
      <div className="text-3xl mb-3">{subject.icon}</div>
      <h3 className="font-bold text-lg group-hover:text-[#6ea8fe] transition">{subject.name}</h3>
      <p className="text-sm text-[#8b98b5]">
        {subject.lessons} lessons{subject.read > 0 ? ` · ${subject.read} read` : ''}
      </p>
      <div className="h-2 bg-[#0c1220] rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#6ea8fe] to-[#c98cff] rounded-full transition-all" style={{ width: `${pct}%` }}></div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/learn/ src/components/learn/
git commit -m "feat: add learn page with subject cards"
```

---

## Phase 4: Question Bank Migration (Session 5)

### Task 4.1: Migration Script

- [ ] **Step 1: Create migration script**

Create `scripts/migrate-lexcommand.ts`:

```typescript
import * as fs from 'fs'
import * as path from 'path'

// Parse LexCommand.html and extract JS objects
function extractObjects(htmlPath: string) {
  const html = fs.readFileSync(htmlPath, 'utf-8')

  // Extract BANK object (questions, lessons, curriculum)
  const bankMatch = html.match(/const\s+BANK\s*=\s*(\{[\s\S]*?\});\s*\n/)
  if (!bankMatch) throw new Error('Could not find BANK object')

  // Extract DECKS object
  const decksMatch = html.match(/const\s+DECKS\s*=\s*(\{[\s\S]*?\});\s*\n/)
  if (!decksMatch) throw new Error('Could not find DECKS object')

  // Extract BLUEPRINTS object
  const blueprintsMatch = html.match(/const\s+BLUEPRINTS\s*=\s*(\{[\s\S]*?\});\s*\n/)
  if (!blueprintsMatch) throw new Error('Could not find BLUEPRINTS object')

  // Extract PAPER_NAMES object
  const papersMatch = html.match(/const\s+PAPER_NAMES\s*=\s*(\{[\s\S]*?\});\s*\n/)
  if (!papersMatch) throw new Error('Could not find PAPER_NAMES object')

  // Extract SYLLABUS object
  const syllabusMatch = html.match(/const\s+SYLLABUS\s*=\s*(\{[\s\S]*?\});\s*\n/)
  if (!syllabusMatch) throw new Error('Could not find SYLLABUS object')

  // Extract DAILY_ENGINE array
  const dailyMatch = html.match(/const\s+DAILY_ENGINE\s*=\s*(\[[\s\S]*?\]);\s*\n/)
  if (!dailyMatch) throw new Error('Could not find DAILY_ENGINE')

  // Extract PLAN array
  const planMatch = html.match(/const\s+PLAN\s*=\s*(\[[\s\S]*?\]);\s*\n/)
  if (!planMatch) throw new Error('Could not find PLAN')

  return {
    bank: JSON.parse(bankMatch[1]),
    decks: JSON.parse(decksMatch[1]),
    blueprints: JSON.parse(blueprintsMatch[1]),
    papers: JSON.parse(papersMatch[1]),
    syllabus: JSON.parse(syllabusMatch[1]),
    daily: JSON.parse(dailyMatch[1]),
    plan: JSON.parse(planMatch[1]),
  }
}

// Transform to database format
function transformData(raw: ReturnType<typeof extractObjects>) {
  // Questions
  const questions = raw.bank.questions.map((q: any, i: number) => ({
    id: `q-${i}`,
    exam: q.exam,
    section: q.section,
    topic: q.topic || null,
    difficulty: q.difficulty || null,
    passage: q.passage || null,
    question_text: q.q,
    options: q.opts,
    correct_answer: q.ans,
    explanation: q.expl || null,
    source: q.source || null,
    verify: q.verify || false,
  }))

  // Subjects (from curriculum)
  const subjects = raw.bank.curriculum
    ? [...new Set(raw.bank.curriculum.map((l: any) => l.subject))].map((name: string, i: number) => ({
        id: `subj-${i}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        icon: null,
        exam: 'shared',
        order: i,
      }))
    : []

  // Lessons
  const lessons = (raw.bank.lessons || []).map((l: any, i: number) => ({
    id: `lesson-${i}`,
    subject_id: subjects.find((s: any) => s.name === l.subject)?.id || null,
    title: l.title,
    order: l.order || i,
    content_markdown: l.content || '',
    words: l.words || 0,
    exam: l.exam || 'shared',
    practice_section: l.practiceSection || null,
  }))

  // Flashcard decks and cards
  const decks: any[] = []
  const cards: any[] = []
  let deckIdx = 0
  let cardIdx = 0

  for (const [deckName, deckCards] of Object.entries(raw.decks)) {
    const deckId = `deck-${deckIdx}`
    decks.push({
      id: deckId,
      name: deckName,
      slug: deckName.toLowerCase().replace(/\s+/g, '-'),
      description: null,
      order: deckIdx,
    })

    for (const [front, back] of deckCards as [string, string][]) {
      cards.push({
        id: `card-${cardIdx}`,
        deck_id: deckId,
        front,
        back,
        order: cardIdx,
      })
      cardIdx++
    }
    deckIdx++
  }

  // Mock definitions
  const mockDefs: any[] = []
  const mockSections: any[] = []

  for (const [exam, bp] of Object.entries(raw.blueprints)) {
    const mockId = `mock-${exam}`
    mockDefs.push({
      id: mockId,
      exam,
      name: bp.name,
      duration_minutes: bp.minutes,
      total_questions: bp.total,
      mark_correct: bp.markCorrect,
      mark_wrong: bp.markWrong,
      negative_marking: bp.neg,
    })

    for (const [i, sec] of bp.sections.entries()) {
      mockSections.push({
        id: `mocksec-${exam}-${i}`,
        mock_id: mockId,
        label: sec.label,
        question_count: sec.want,
        section_filters: { include: [sec.label] },
        order: i,
      })
    }
  }

  // Past papers
  const pastPapers = Object.entries(raw.papers).map(([key, name], i) => {
    const [exam, year] = key.split('_')
    return {
      id: `paper-${i}`,
      exam,
      year: parseInt(year),
      name: name as string,
      source: null,
      pdf_url: null,
      order: i,
    }
  })

  // Section aliases (from SYLLABUS)
  const aliases: any[] = []
  let aliasIdx = 0

  for (const [exam, data] of Object.entries(raw.syllabus)) {
    for (const sectionName of Object.keys(data.sections)) {
      aliases.push({
        id: `alias-${aliasIdx}`,
        canonical_name: sectionName,
        alias: sectionName,
        source: 'syllabus',
      })
      aliasIdx++
    }
  }

  return { questions, subjects, lessons, decks, cards, mockDefs, mockSections, pastPapers, aliases }
}

// Save to JSON files for Supabase import
function saveToJSON(data: ReturnType<typeof transformData>, outputDir: string) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  for (const [key, value] of Object.entries(data)) {
    fs.writeFileSync(path.join(outputDir, `${key}.json`), JSON.stringify(value, null, 2))
    console.log(`Exported ${key}: ${Array.isArray(value) ? value.length : Object.keys(value).length} items`)
  }
}

// Main
const htmlPath = process.argv[2] || '../Law Prep/LexCommand.html'
const outputDir = process.argv[3] || './migrated-data'

console.log(`Extracting data from ${htmlPath}...`)
const raw = extractObjects(htmlPath)

console.log('Transforming to database format...')
const data = transformData(raw)

console.log(`Saving to ${outputDir}...`)
saveToJSON(data, outputDir)

console.log('Done!')
```

- [ ] **Step 2: Run migration script**

```bash
npx ts-node scripts/migrate-lexcommand.ts "../Law Prep/LexCommand.html" "./migrated-data"
```

Expected: 7 JSON files created in `./migrated-data/` with correct counts.

- [ ] **Step 3: Verify counts**

Check that the counts match:
- `questions.json`: ~1000+ questions
- `subjects.json`: ~6 subjects
- `lessons.json`: ~30 lessons
- `decks.json`: 5 decks
- `cards.json`: ~100 cards
- `mockDefs.json`: 3 mocks
- `pastPapers.json`: 7 papers

- [ ] **Step 4: Create seed script**

Create `scripts/seed-supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const DATA_DIR = './migrated-data'

async function seedTable(tableName: string, data: any[]) {
  if (data.length === 0) {
    console.log(`Skipping ${tableName} (empty)`)
    return
  }

  // Supabase has a 1000-row limit per insert, so batch
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const { error } = await supabase.from(tableName).insert(batch)

    if (error) {
      console.error(`Error inserting ${tableName} batch ${i}:`, error.message)
    } else {
      inserted += batch.length
    }
  }

  console.log(`Seeded ${tableName}: ${inserted}/${data.length} rows`)
}

async function main() {
  const tables = [
    'questions',
    'subjects',
    'topics',
    'lessons',
    'flashcard_decks',
    'flashcards',
    'mock_definitions',
    'mock_sections',
    'past_papers',
    'section_aliases',
    'achievements',
  ]

  for (const table of tables) {
    const filePath = path.join(DATA_DIR, `${table}.json`)
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      await seedTable(table, data)
    } else {
      console.log(`Skipping ${table} (file not found)`)
    }
  }

  console.log('Seeding complete!')
}

main().catch(console.error)
```

- [ ] **Step 5: Commit**

```bash
git add scripts/
git commit -m "feat: add migration script + seed script for LexCommand data"
```

---

## Phase 5-11: Remaining Features

> The remaining phases (Drill, Full Mocks, Mock Arena, Flashcards, Current Affairs, Syllabus, Profile) follow the same pattern as above. Each phase:
> 1. Creates the page route
> 2. Creates the components
> 3. Creates the API route if needed
> 4. Tests locally
> 5. Commits

Due to length constraints, the detailed code for these phases will be generated during execution. The structure is:

- **Phase 5 (Drill):** Builder → Session → Results
- **Phase 6 (Full Mocks):** Selector → Timed Session → Auto-grade → Review
- **Phase 7 (Mock Arena):** KPIs → Weak Sections → Trend Chart → History
- **Phase 8 (Flashcards):** Deck List → SM-2 Review → Due Queue
- **Phase 9 (Current Affairs):** Monthly Tabs → Markdown Render → Quiz
- **Phase 10 (Syllabus + Profile):** Visual Tracker → Exam Targets → Theme Toggle → Achievements
- **Phase 11 (Polish & Deploy):** Vercel deploy → RLS verify → Smoke test

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-23-law-prep-lms-implementation.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
