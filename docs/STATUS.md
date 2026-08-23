# Fictifly — Status

**Last verified:** ⚠️ NEVER — this is a reconstruction, see below
**Maintainer:** Geoff
**Target:** private beta

> ⚠️ **This draft was assembled from past chat sessions, not from the codebase.**
> The newest thing in it is roughly two months old and several items may be
> done, abandoned, or wrong. Treat every line as a question until you've
> checked it. Once corrected, this becomes the record and chat stops being it.
>
> **Update rule:** end of each working session, edit this file, commit. If a
> session produced a decision rather than code, it goes in `DECISIONS.md`.

---

## How to use this repo's docs

Read `docs/` at the start of any session — including when briefing Claude
or Claude Code. That's the whole system.

| File | Holds | Cadence |
|---|---|---|
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
- Account types: `standard`, `premium`, `teacher`, `teacher_plus`, `minor` (13–17), `student`
- `src/utils/accountTiers.js` is the single source of truth for role checks —
  `isTeacherRole()`, `isPremiumWriter()`, `isStudentRole()`, `CLASS_LIMIT_BY_TIER`,
  `STUDENT_LIMIT_BY_TIER`. Never compare `account_type` to a string literal.
- Age gate: teens enter via class code only during beta, no open self-registration.
  Under-13 routes to teacher pathway. Parent waitlist with guardian confirmation.
- `ProtectedRoute` is auth-only. Profile-complete redirect lives in `Dashboard.jsx`.

### Onboarding
Three flows off one `Onboarding.jsx`, selected by `account_type`:
regular, teacher (attestation + class creation + bulk students), student (minimal, dark).

### Classroom
Class creation, bulk student generation with generated usernames, assignments,
teacher feedback and grading (v2 spec), retention cron at midnight UTC.

### Writing
Microfiction, Flash Fiction, Character Generator. Daily prompt with character
days (`dateNum % 7 < 2`). Badges. The Well + WellModal.

### Compliance
Data-minimising architecture: client-side age verification, derived date field
rather than birthdate, synthetic student emails, generated usernames for minors,
adult/minor separation, Claude Haiku three-tier moderation.

---

## Open — verify all of these

### Bugs (last seen July, status unknown)
- [ ] Rubric scores write only to the JSONB blob on `assignment_feedback`,
      not to the normalised `rubric_scores` table
- [ ] No student-facing feedback view exists at all
- [ ] `CreateAssignmentForm.jsx` — calls a `getPrompts` API action that doesn't exist

### Design system (found this session, Aug)
- [ ] `Dashboard.jsx` root sets `fontFamily: 'sans-serif'`, overriding DM Sans
      for everything beneath it. Brand fonts are largely not rendering.
- [ ] `ink-light` (#9A8878) is 3.33:1 on white — below WCAG AA 4.5:1 — and is
      carrying real text (stat labels, generator copy, assignment metadata)
- [ ] `terra-dark` (#B56840) is 4.09:1 as text — also short
- [ ] Character-day card uses violet (#7A4A90 / #B07AC0 / #F5EDF5). No violet
      exists in Barceloneta. Same class of drift as the green incident.
- [ ] Trial banner uses #9A6830 where `gold-dark` is #8A6030
- [ ] A third hand-inlined copy of the Well SVG sits in `Dashboard.jsx`
      alongside the two synced `TheWell.jsx` files
- [ ] `theme.css` drafted but not yet adopted — token layer + optional dark mode

### Launch
- [ ] Domain: confirm `fictifly.com` registered, WHOIS privacy on
- [ ] Landing page: static build ready, needs GitHub Pages deploy + DNS
- [ ] Waitlist: Kit account + form ID pasted into the landing page
- [ ] Privacy policy / legal counsel session — eight questions prepared

---

## Priority

Ordered by what blocks what, not by size.

**1 — Legal.** The counsel session gates public launch. Everything else can
proceed in parallel; this can't be compressed at the end, and the questions
have been prepared for months.

**2 — The two feedback bugs.** Teacher grading is the classroom pitch. A
missing student feedback view means the loop doesn't close — a teacher can
grade into a void. This is a functional hole, not polish.

**3 — Fonts.** One line. The app isn't rendering in its own typefaces.

**4 — Landing page + waitlist.** Cheap, and it starts collecting names while
everything else is in progress. Nothing depends on it, so it's easy to keep
deferring — which is the argument for doing it now.

**5 — Token adoption + contrast.** Not urgent, but every component built
before it lands is another one to migrate later. The contrast fixes matter
for school procurement.

**6 — Dark mode.** Post-beta. The palette already contains both ends of every
ramp, so it's cheaper than it looks — but it doubles visual QA on everything
built from here.

---

## Deliberately not doing

- Squarespace for the marketing site — GitHub Pages until there's reason to spend
- Mailchimp — free tier cut to 250 contacts / 500 sends in Feb 2026
- Tailwind / CSS modules migration — inline styles referencing CSS variables
  is sufficient and avoids a risky rewrite
- School-tier retention extension — deferred as an additive
  `classes.retention_extension_days` layer