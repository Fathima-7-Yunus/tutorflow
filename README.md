# TutorFlow

A session platform for online tutors. Tutors manage students, schedule one-to-one sessions, take notes with autosave, and use AI to plan each session before it starts and review it afterwards. Students log in to see their upcoming sessions, past session notes, and the homework the AI generated for them.

**Live app:** https://tutorflow-green.vercel.app
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres + Auth + RLS), OpenAI-compatible API, deployed on Vercel.

## Test logins

| Role    | Email                | Password      |
| ------- | -------------------- | ------------- |
| Tutor   | `tutor@tutorflow.com`  | `tutor12345`   |
| Student | `student@tutorflow.com`| `student12345` |

## What works / what doesn't

**Works**
- Login with two roles (tutor / student). No public sign up — tutors create student accounts. Roles are enforced server-side (proxy + route handlers + Row Level Security), not just hidden in the UI.
- Data isolation: a tutor sees only their own students and sessions; a student sees only their own sessions.
- Student profiles (subject, level, learning goals, weak areas) — the data the AI reads.
- Scheduling with form validation and clash detection — a tutor cannot have two sessions overlapping a 60-minute window, including on reschedule.
- Session lifecycle enforced in order: `scheduled → in_progress → completed → ai_reviewed`. The state is also enforced by a database trigger, so a session can never skip a state. Once completed, nothing can be edited except triggering the AI review.
- Session notes with debounced autosave (1.5s), a Saving/Saved indicator, and a flush on tab close / unmount via `sendBeacon`.
- Student view: upcoming sessions, past session notes (read-only), and homework from AI reviews.
- Progress view: the tutor sees all of a student's sessions in order and can generate an AI progress summary from every past review.
- Loading states on all async buttons and clear inline error messages.

**Doesn't work / notes**
- **AI features need a funded API key.** The app is wired to the `OPENAI_API_KEY` / `OPENAI_BASE_URL` you provided (api.b.ai), but that account currently has no deposit, so every AI model returns "Access restricted / deposit required." The app handles this gracefully — it never crashes, it shows a friendly error and lets the tutor retry. Add a deposit on api.b.ai, or set a working OpenAI key as the `OPENAI_API_KEY` env var on Vercel, and the plan / review / progress features will work with no code changes.
- Email notifications on scheduling (the bonus feature) were not implemented.
- Editing a student's profile details after creation is not yet exposed in the UI (the tutor creates the profile up front).

## Session lifecycle

Every session moves through exactly these states in order, enforced both in code and by a Postgres trigger:

```
Scheduled → In progress → Completed → AI reviewed
```

- **Scheduled:** tutor can generate an AI plan, then start the session (allowed from 15 minutes early).
- **In progress:** notes editor is active with autosave.
- **Completed:** notes become read-only. Nothing can be edited.
- **AI reviewed:** the review is generated; the session is final.

## Database structure

```
auth.users  (Supabase managed)
   │
   └── profiles  (one row per user: id → auth.users, email, full_name, role 'tutor'|'student')
          │
          ├── students  (tutor_id → profiles.id, user_id → profiles.id, name, subject,
          │              current_level, learning_goals, weak_areas)
          │
          └── sessions  (tutor_id → profiles.id, student_id → students.id, topic,
                         starts_at timestamptz, status enum session_status,
                         notes text, ai_plan jsonb, ai_review jsonb)
```

Relationships:
- A **tutor** has many **students** (`students.tutor_id`).
- A **student** belongs to one tutor and has many **sessions** (`sessions.student_id`).
- A **session** belongs to one student and one tutor.
- `ai_plan` and `ai_review` are JSONB, so the structured AI output (objectives / outline / practice questions / summary / homework / next suggestion) is stored without extra tables.

Key database features:
- **Trigger `handle_new_user`** — creates a `profiles` row automatically whenever an auth user is created (so tutor-created student accounts work).
- **Trigger `check_session_status`** — rejects any status change that jumps a state or edits a completed session.
- **Trigger `handle_updated_at`** — keeps `sessions.updated_at` fresh.
- **Row Level Security** — tutors only see their own students/sessions; students only see their own sessions; no table is world-readable.
- Indexes on `students.tutor_id`, `students.user_id`, `sessions.tutor_id`, `sessions.student_id`.

The full migration is in `supabase/migrations/0001_init.sql`.

## AI prompts (and why they're written this way)

All AI calls go through server-side route handlers (`/api/ai/plan`, `/api/ai/review`, `/api/ai/progress`) so the API key never reaches the browser. Every call asks for **JSON output**, and the app validates the shape before saving — if the AI returns something malformed or fails, the app shows an error and never breaks.

### 1. Session plan (`/api/ai/plan`)

The system prompt tells the model it is an experienced one-to-one tutor and must return a JSON object with `objectives` (2–3), `outline` (exactly 4 points), and `practice_questions` (exactly 3). The user prompt sends:

- the full student profile (name, subject, level, goals, weak areas),
- the session topic,
- every **past session topic plus its AI review** for that student.

Why: a plan that ignores the student's level, weak areas, and what was already covered would be generic. Including past reviews lets the model avoid repeating material and build on prior progress. Enforcing exact counts keeps the output consistent so the UI can render it cleanly.

### 2. Session review (`/api/ai/review`)

The system prompt instructs the model to produce a JSON object with `summary`, `homework` (2–3 tasks), and `next_suggestion`. The user prompt sends:

- the student profile,
- the session topic,
- the original AI plan's objectives (if any),
- the session notes,
- past AI reviews' summaries.

Why: homework is only useful if it targets the student's weak areas and the session content. Sending the notes grounds the summary in what actually happened, sending the plan keeps it honest to the intended objectives, and sending past reviews keeps homework coherent across sessions.

### 3. Progress summary (`/api/ai/progress`)

The system prompt asks for a short paragraph (3–5 sentences) on where the student is improving and where they still struggle, with specifics. The user prompt sends every past AI review (summary + homework + next suggestion) for that student.

Why: a progress view is only meaningful if it aggregates evidence. Feeding all reviews verbatim lets the model cite specific topics and patterns instead of writing vague praise.

## Running locally

```bash
npm install
npm run dev
```

The app reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, and `OPENAI_BASE_URL` from `.env.local`. You'll also need the database schema applied (see `supabase/migrations/0001_init.sql`).

## What I would build next (if I had another day)

I would add email notifications when a tutor schedules a session, using a free mailer like Resend, since that was the one bonus item I skipped and it closes the loop for students. I would also let tutors edit a student's profile after creation, and add a per-session "homework completion" marker so the tutor and student can track whether tasks from an AI review got done. I would add the ability to cancel or delete scheduled sessions (with the clash check released), and I would build a small admin/dev page to seed demo data so reviewers can try every feature with one click. Finally, I would invest in a typed Supabase schema generator so the database columns are checked at compile time rather than at runtime.
