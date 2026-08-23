# Fictifly

A creative-writing platform for individual writers and classrooms. Generate
AI-assisted microfiction, flash fiction, and characters; build a writer profile;
run classrooms with assignments, rubric grading, and student rosters.

Pre-beta. Not open to public registration.

---

## Start here

| File | Holds |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Architecture, conventions, API patterns, gotchas |
| [`docs/STATUS.md`](docs/STATUS.md) | Current state, open bugs, priorities |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Choices and *why* — append-only |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Barceloneta palette, type, component rules |

Read `docs/STATUS.md` first after any break. Read `CLAUDE.md` before touching code.

---

## Stack

Create React App · Vercel serverless functions (`/api`) · Supabase (Postgres + Auth) ·
Anthropic API · Barceloneta design system

---

## Running locally

```bash
npm install
npm start          # http://localhost:3000
npm run build      # production build to /build
```

Needs a `.env` with `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`,
and `REACT_APP_ANTHROPIC_KEY`. Never commit it. Server-side vars
(`SUPABASE_SERVICE_ROLE_KEY` and friends) are set in Vercel, not locally.

`/api` functions don't run under `npm start` — use `vercel dev` or deploy.

---

## Deploying

```bash
npm run build      # catch ESLint errors that don't surface in dev
git push origin main
npx vercel --prod
```

Vercel project: `bergengeoff-creators-projects/fictifly-v2`

---

## Layout

```
api/                Vercel serverless functions
docs/               Project record — read first
src/
  components/       Shared UI
  context/          AuthContext — source of truth for user + profile
  pages/
    generators/     Microfiction, Flash Fiction, Character
  styles/
    theme.css       Design tokens
  utils/
CLAUDE.md           Architecture and conventions
```

---

## Accounts

`standard` · `teacher` · `teacher_plus` · `student` · `minor`
(plus an `is_premium` / `premium_expires_at` trial flag on top)

Minors join by class code only — no open self-registration. Student accounts are
teacher-created, using a synthetic `<username>@minor.fictifly.com` identity and a
numeric passcode. Adult and minor content never share a feed.

The privacy architecture is deliberately data-minimising. Compliance review with
counsel is pending and gates public beta.

See `CLAUDE.md` for the full auth model and role-check conventions.

---

## Working on this

Solo project. End each session by updating `docs/STATUS.md` and committing it
alongside the code.