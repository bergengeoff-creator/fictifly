# Fictifly — Status

**Last verified:** 2026-08-23 (against the codebase, via Claude Code)
**Maintainer:** Geoff
**Target:** teacher pilot, then private beta

**Update rule:** end of each working session, edit this file and commit it with
the code. If a session produced a decision rather than code, it goes in
`DECISIONS.md`. If it changed the visual system, `DESIGN.md`.

---

## How to use this repo's docs

Read `CLAUDE.md` and `docs/STATUS.md` at the start of any session — including
when briefing Claude or Claude Code. That's the whole system.

| File | Holds | Cadence |
|---|---|---|
| `CLAUDE.md` | Architecture, conventions, API patterns | When the code shape changes |
| `STATUS.md` | Current state, open bugs, what's next | Every session |
| `DECISIONS.md` | Choices + rationale, append-only | When something is decided |
| `DESIGN.md` | Palette, type, component rules | When the system changes |

---

## Stack

React CRA · Supabase · Vercel Pro · Anthropic API · Barceloneta design system

- Vercel project: `bergengeoff-creators-projects/fictifly-v2`
- Deploy: `git push origin main`, then `npx vercel --prod`
- **Build rule:** `src/components/TheWell.jsx` and `src/utils/TheWell.jsx`
  must remain identical copies. Divergence has broken the build before.

---

## Built

### Accounts & auth
- Account types: `standard`, `teacher`, `teacher_plus`, `minor` (13–17), `student`
  (`premium` is not an account type — it's an `is_premium` / `premium_expires_at`
  flag on top)
- `src/utils/accountTiers.js` is the single source of truth for role checks —
  `isTeacherRole()`, `isPremiumWriter()`, `isStudentRole()`, `CLASS_LIMIT_BY_TIER`,
  `STUDENT_LIMIT_BY_TIER`. Never compare `account_type` to a string literal.
  (Verified Aug 2026: defined once, imported by `ClassroomDashboard.jsx`.)
- Age gate: teens enter via class code only during beta, no open self-registration.
  Under-13 routes to teacher pathway. Parent waitlist with guardian confirmation.
- `ProtectedRoute` is auth-only. Profile-complete redirect lives in `Dashboard.jsx`.

### Onboarding
Three flows off one `Onboarding.jsx`, selected by `account_type`:
regular, teacher (attestation + class creation + bulk students), student (minimal, dark).

### Classroom
Class creation, bulk student generation with generated usernames, assignments,
teacher feedback and grading (v2 spec), retention cron at midnight UTC.

Two live paths for assigning a prompt, deliberately distinct:
- `CreateAssignmentForm.jsx` — classroom side, "+ New Assignment". Build an
  assignment from a saved prompt, ingredients, or a generator type.
- `AssignModal.jsx` — generator side, "Assign" on a prompt card. Send the
  prompt you're already looking at to a class.

### Writing
Microfiction, Flash Fiction, Character Generator. Daily prompt with character
days (`dateNum % 7 < 2`). Badges. The Well + WellModal.

### Compliance
Data-minimising architecture: client-side age verification, derived date field
rather than birthdate, synthetic student emails, generated usernames for minors,
adult/minor separation, Claude Haiku three-tier moderation.

---

## Open

### New Products
- [ ] One-liner generator not built. Add a `soon: true` entry to the
      `generators` array in `Dashboard.jsx` (render disabled, like the existing
      `new: true` pill) so pilot teachers see it's coming. Schema question
      first — see `DECISIONS.md`.

### Bugs
- [ ] **Student-facing feedback view missing.** Backend `getSubmissionFeedback`
      exists (`api/teacher-features.js:1723`, labelled `// STUDENT FEEDBACK VIEW`)
      but its only caller is `GradingModal.jsx:128`, reached from
      `ClassroomDashboard.jsx` — which redirects non-teachers away. No matching
      route in `src/App.js`, no page in `src/pages/`. A graded student currently
      has no way to see their feedback.
- [ ] **`rubric_scores` read but never written.** `saveFeedback`
      (`api/teacher-features.js:1217`) writes scores into a JSONB column on
      `assignment_feedback`. `getSubmissionFeedback` (line 1763) queries a
      separate normalised `rubric_scores` table that nothing ever inserts into.
      Half-built feature — see Schema below for the decision needed.

### Design system
- [ ] Token adoption — `theme.css` is imported and live, but components still
      use hex literals inline. Migrate per component, not in one sweep.
- [ ] `ink-light` #9A8878 is 3.33:1 on white — below WCAG AA 4.5:1 — and carries
      real text (stat labels, generator copy, assignment metadata). `ink-faint`
      #7E6B59 is in `theme.css` as the replacement.
- [ ] `terra-dark` #B56840 is 4.09:1 as text. Use `terra-text` #A85535 instead.
- [ ] Character-day card uses violet (#7A4A90 / #B07AC0 / #F5EDF5). No violet
      exists in Barceloneta — same class of drift as the green incident. Decide
      gold or keep, then log it in `DECISIONS.md`.
- [ ] Trial banner uses #9A6830 where `gold-dark` is #8A6030.

### Schema
- [ ] **Decide `rubric_scores`.** Wire it up (enables per-category analytics —
      class averages by criterion, weakest-criterion views) or drop it and have
      `getSubmissionFeedback` read the JSONB blob. Two half-built paths is the
      worst option. Not needed for the teacher pilot.
- [ ] `assignments.prompt_title` / `prompt_content` — now unwritten and unread.
      Dead columns, safe to drop.

### Environment
- [ ] Local clone `~/Documents/fictifly-repo` has no `.env.local`, so the dev
      server can't boot there. Values are in Vercel → Settings → Environment Variables.
- [ ] Codespace dev server errors on `supabaseUrl is required` despite
      `.env.local` being present. Try a clean restart — CRA reads env files only
      at startup.

### Needs eyes
- [ ] Welcome-screen Well is now 64px (`size="icon"`), down from a 120px inline
      SVG. May be undersized for a first-impression screen.
- [ ] Confirm Fraunces / DM Sans actually render now that the `sans-serif`
      override is gone. If not, check the font link in `public/index.html`.

### Landing page (separate static repo)
- [ ] Replace placeholder generator samples with real output from microfiction,
      flash fiction, and the character generator — current vocabulary is invented
- [ ] Run `waitlist-setup.sql` in Supabase, then paste `SUPABASE_URL` and
      `SUPABASE_ANON_KEY` into the two variables in `index.html`
- [ ] Deploy to GitHub Pages, point `fictifly.com` DNS, enable HTTPS
- [ ] Confirm mobile masthead doesn't crowd at 390px (logo + two links)
- [ ] Privacy note on the page before the URL is promoted publicly
- [ ] 401 Error. Key checks out cleanly. Fresh publishable key possible, before support call

### Launch
- [ ] Domain: confirm `fictifly.com` registered, WHOIS privacy on
- [ ] Landing page: static build ready, needs GitHub Pages deploy + DNS
- [ ] Waitlist: Kit account + form ID pasted into the landing page
- [ ] Legal: scoped consult on running a small educator pilot, then the fuller
      privacy/compliance session before any real students

---

## Priority

The near-term goal is a **teacher pilot** — a handful of selected educators,
possibly not currently teaching, evaluating from the teacher point of view.
No real students, so no student data, so the COPPA/FERPA questions largely
don't attach yet. Legal moves behind product for this stage.

**1 — Student feedback view.** The first thing a teacher will ask is "what does
my student see?" Right now: nothing. That undercuts the entire grading feature
they're being asked to evaluate. Read from the JSONB blob; skip `rubric_scores`.

**2 — Walk the teacher flow end to end.** Create class → add students → assign →
grade → view as student. Fix whatever breaks. This is the pilot script.

**3 — Feedback capture.** Somewhere for pilot input to land. A doc is enough.
Feedback from a few educators is the most valuable signal available right now.

**4 — Visual check.** Well sizing, fonts. Cheap, and it's what they see first.

**5 — Token adoption + contrast.** Every component built before it lands is one
more to migrate later. The contrast fixes matter for school procurement.

**6 — Landing page + waitlist.** Starts collecting names in the background.

**7 — Legal.** Scoped consult before real students. Full session before public beta.

**8 — Dark mode.** Post-beta. The palette already holds both ends of every ramp,
so it's cheaper than it looks — but it doubles visual QA on everything after.

---

## Deliberately not doing

- Squarespace for the marketing site — GitHub Pages until there's reason to spend
- Mailchimp — free tier cut to 250 contacts / 500 sends in Feb 2026
- Tailwind / CSS modules migration — inline styles referencing CSS variables is
  sufficient and avoids a risky rewrite
- A `getPrompts` API action — `saved_prompts` is read client-side under RLS
- School-tier retention extension — deferred as an additive
  `classes.retention_extension_days` layer