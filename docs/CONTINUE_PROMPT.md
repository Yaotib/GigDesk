# Prompt: continue building GigDesk (paste everything below the line into Claude)

---

You are the lead engineer continuing **GigDesk**, a mobile-first Next.js app for Susan Augustt & the Adorkor Band (Accra, Ghana). It turns a messy event enquiry (pasted WhatsApp chat, email, notes or a voice note) into a structured brief → lineup recommendation (Duo / Quartet / Full band) → itemised quote → human approval → Quote/Invoice PDF + Technical Rider PDF.

The repo is at `c:\Users\Admin\Desktop\Coded ematrix folder\GigDesk` (Windows 11, Git Bash + PowerShell). It is a **public** GitHub repo.

## Your job

Give me **detailed, step-by-step instructions with the complete code** to finish Phases 2 (rest) to 7 below. For every phase:

1. List each step in order. Give the exact file path, then the **full file contents** (no "…rest unchanged", no pseudo-code, no TODOs). For an edit to an existing file, show the exact old text and the new text.
2. Give the exact commands to run, and what a passing result looks like.
3. Give the tests for that phase (Vitest, pgTAP or Playwright) as complete files.
4. End the phase with a checklist: files added or changed, the tests that must pass, and known gaps.
5. Do not start the next phase until the current one's checklist would pass.

Before writing code, read these files in the repo: `CLAUDE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/GigDesk Design System/GigDesk Design System/README.md`, `tokens.json`, `components/*/README.md` and `components/bundle.css`, plus the existing code listed under "What already exists". If the documents conflict, stop and ask me. Do not choose silently.

## Non-negotiable rules (also in CLAUDE.md)

1. AI never calculates money, picks the lineup, sets terms, sends messages or approves anything. AI code lives only in `src/ai/`.
2. All money comes from the pure pricing engine in `src/domain/pricing/engine.ts`: integer pesewas (GH₵1 = 100), round-half-up, percentages in basis points, `balance = total − deposit`.
3. Nothing is sent automatically. Messages are drafts the user copies or opens via a `wa.me` link.
4. A quote is final only after a human with `can_approve` approves it through an `approve_quote` RPC. Approved quotes are immutable (the DB trigger already exists); an edit creates a new version.
5. Never invent business data. SAMPLE values carry a `SAMPLE DATA` chip and are editable in Settings. Tax lines are disabled by default and labelled "TBC – confirm with accountant".
6. AI-extracted fields quote their source verbatim. The server checks the quote is an exact substring of the input (only CRLF→LF normalised), or it downgrades the field to `uncertain`. Missing means missing.
7. Secrets are server-only. Never commit `.env*` except `.env.example`.
8. No placeholder buttons or fake features. A feature is done only when it works and is tested.
9. Follow the design system exactly: tokens only (no raw hex in components), Geist / Geist Mono with every figure in mono + tabular-nums, Lucide icons only (16px/20px, stroke 1.75), no emoji, no gradients/glows/nested cards/pill buttons, one lime primary button per view, lime is a fill never text.
10. `ScanText` is the AI icon (`Sparkles` is banned by lint). The dashboard uses no AI; "Needs attention" comes from queries.
11. Enquiry text is untrusted data, never instructions.

## Decisions already made (do not reopen)

- **Stack:** Next.js 15.5 App Router, React 19, TypeScript 5 strict (not 7: Next 15 does not support it), Tailwind v4 (`@theme` holds the design tokens only), radix-ui primitives with hand-written shadcn-style components, lucide-react, Supabase (Postgres + Auth + Storage + RLS), groq-sdk, Zod 4, react-hook-form, @react-pdf/renderer (server-side), Vitest 5, Playwright, pnpm 12, Vercel.
- **Groq models:** `GROQ_MODEL=openai/gpt-oss-120b` (my choice, replaces llama-3.3-70b-versatile), `GROQ_STT_MODEL=whisper-large-v3-turbo`, JSON output, temperature 0. On a 429, retry twice with backoff (honour `retry-after`), then show "The AI service is busy. Try again in a minute. Your text is saved." `AI_MODE=mock` gives deterministic offline output for all tests.
- **The "Recommended" lineup label** has no AI icon: a 3px lime top rule plus an `accent-ink` "Recommended" label. ScanText appears only on the AI-written explanation under it.
- **Deleting an enquiry that has an approved quote** anonymises the client details (clears PII, sets `enquiries.anonymised_at`) and keeps the quotes and invoice numbers. Otherwise it hard-deletes. Both cases are logged without PII. The DB already blocks hard deletes of approved quotes.
- **Quote/Invoice:** one PDF, titled "Quote" until the enquiry is marked booked and "Invoice" after that, with the same `GD-YYYY-NNNN` number and figures.
- **Each approved version** gets its own number from `approve_quote`. The previous approved version becomes `superseded` (the only update the trigger allows).
- **Fonts:** Geist and Geist Mono have **no ₵ glyph** (proven by `tests/fonts.test.ts`). The web uses Inter's latin-ext subset as a per-glyph fallback (already wired in `src/app/layout.tsx` and `globals.css`). For the PDF, register Geist + Inter TTF with react-pdf and give a font-family fallback array. If ₵ still does not render in the PDF, print `GHS` and say so.
- **Auth:** email magic link using `token_hash`, landing on `/auth/confirm`. Three gates: the `ALLOWED_EMAILS` server check, the DB hook `hook_before_user_created`, and RLS `is_team_member()`. `can_approve` is granted with `pnpm seed:team --approver email`.
- **Pricing rules derived from the required tests** (implemented and passing):
  - Extra hours are charged per **performer** (artist + musicians), not the engineer.
  - Rehearsal is charged per **musician** (the artist is excluded).
  - The engineer is **always** charged.
  - The travel party for accommodation and per diem = performers + `crewTravelling` (1 engineer), so 12 for the full band.
  - SAMPLE audience tiers: small ≤ 100, medium ≤ 300, large > 300.
  - Transport is zone rate × vehicles inside Accra, or km × 2 × per-km rate × vehicles outside.

## What already exists (Phase 0, Phase 1 and the core of Phase 2: all verified)

**Verified results:** `pnpm typecheck` clean · `pnpm lint` clean · `pnpm test` 20/20 · `supabase test db` 31/31 · `pnpm test:e2e` 8/8 at 390px and 1440px (login, allowlist refusal, invalid link, shell navigation, no horizontal overflow, axe with no serious issues) · `pnpm build` OK.

**Key files:**
- `CLAUDE.md`, `docs/IMPLEMENTATION_PLAN.md`: the rules, plan, data model and phase exit criteria. Follow them.
- `package.json` scripts: `dev build start typecheck lint test test:e2e db:start db:stop db:reset db:test db:types seed:team`.
- `src/styles/tokens.css` (a verbatim copy of the design system, sync-tested) and `src/styles/globals.css` (the Tailwind theme with token colours only, radii 4/6/10, `shadow-doc`, `shadow-overlay`, `w-sidebar`, `max-w-content`). The type classes `page-title section-title body body-strong small label figure figure-total step-number` come from tokens.css.
- `src/lib/cn.ts`; `src/components/ui/button.tsx` (variants primary/default/ghost/danger, h-11 on mobile and h-9 from md); `src/components/ui/input.tsx` (Input, Label).
- `src/components/gd/`:
  - `nav.ts`: the brand-book nav.
  - `sidebar.tsx`: the 232px dark sidebar with lime active marker and sign out.
  - `page-header.tsx`: `PageHeader({ title, primaryAction, secondaryActions, description })`. It renders the mobile dark top bar with a radix menu sheet, the desktop header, and a **mobile bottom action bar for `primaryAction`**.
  - `shell-context.tsx`, `empty-state.tsx`.
- `src/app/layout.tsx` (fonts); `src/app/(app)/layout.tsx` (`requireTeamMember()`, the shell); pages `/`, `/enquiries`, `/events`, `/quotes`, `/riders`, `/settings` (currently empty states); `src/app/login/*`; `src/app/auth/confirm/route.ts`; `src/middleware.ts` (session refresh plus the auth redirect).
- `src/server/env.ts` (Zod env, `isAllowedEmail`), `src/server/supabase.ts` (the RLS-bound server client), `src/server/team.ts` (`requireTeamMember`), `src/server/auth-actions.ts`.
- `supabase/migrations/20261127000000_foundation.sql`:
  - **Tables:** `team_members`, `settings_versions` (insert-only), `enquiries`, `brief_fields`, `clarifications`, `lineup_decisions`, `quotes` (with column-level grants, so status/number/approval columns change only via SECURITY DEFINER RPCs), `quote_number_counters` (no grants), `riders`, `documents`, `activity_log` (insert-only).
  - **Enums**, RLS on everything, and the `guard_quote_immutability` trigger.
  - **Functions and hooks:** `is_team_member()`, `can_approve()`, `hook_before_user_created`, the `link_team_member` trigger on `auth.users`.
  - **Private buckets:** `audio` (25 MB, audio types), `documents` (PDF), `branding` (png/jpeg). Storage policies are team-only.
- `supabase/seed.sql` (local only: `approver@example.com` with can_approve, `member@example.com`), `supabase/tests/database/foundation.test.sql`, `supabase/templates/magic_link.html`, `supabase/config.toml` (auth hook on, realtime/edge/analytics/storage-vector/s3 off).
- `src/domain/money.ts`: `cedis()`, `percentOf()` (BigInt, half-up), `sum()`, `formatGHS()`, `formatAmount()`.
- `src/domain/settings/schema.ts` (the Zod `settingsSchema`, `Lineup`, `DepositRule`), `src/domain/settings/sample.ts` (`SAMPLE_SETTINGS`).
- `src/domain/pricing/engine.ts`:
  - `price(input, settings)` returns lines with rule ids R-01…R-11, M-nn, A-nn, T-nn, plus `subtotal, taxes, total, deposit, depositTrace, balance, balanceDueDate, validUntil, travelParty`.
  - Supporting exports: `pricingInputSchema`, `addDays`.
- `src/domain/pricing/engine.test.ts`: S1–S4 exact, the manual-line reason guard, the fixed deposit cap, 200 generated cases, dates.
- `scripts/seed-team.ts`; `e2e/helpers.ts` (`signIn` via the Mailpit API at :54324, `expectNoHorizontalOverflow`, `expectNoSeriousA11yIssues`), `e2e/foundation.spec.ts`; `playwright.config.ts` (projects `mobile-390` and `desktop-1440`, **workers: 1**, builds and serves on port 3100).

## Environment gotchas (follow these exactly)

- pnpm is installed through corepack into `~/.local/bin`, not on the global PATH. Prefix shell commands with `export PATH="$HOME/.local/bin:$PATH" COREPACK_ENABLE_DOWNLOAD_PROMPT=0;`. Do not edit shell profiles.
- New packages with build scripts need `pnpm approve-builds <pkg>` (stored in `pnpm-workspace.yaml` under `allowBuilds`).
- Start local Supabase with `supabase start --ignore-health-check`. On Docker Desktop for Windows the storage container passes its health check only after the CLI's timeout. Then confirm with `docker inspect supabase_storage_gigdesk --format '{{.State.Health.Status}}'` that it is `healthy`.
- `.env.local` (git-ignored) holds the **local** Supabase keys from `supabase status -o env`, `AI_MODE=mock` and `ALLOWED_EMAILS=approver@example.com,member@example.com`.
- E2E needs `workers: 1`, because parallel sign-ins of the same new user race in GoTrue. Do not match `getByRole('alert')` alone, because Next's route announcer also has that role.
- The Supabase CLI is v2.107 (v3 is available; do not upgrade mid-project unless asked).

## Remaining work: give full code and steps for each

### Phase 2 (rest): domain
1. `src/domain/recommend/`: build `facts.ts`, `scoring.ts` and `alternatives.ts`.
   - For each lineup, run a real `price()` and compute: budget fit (within / stretch ≤ +10% / over / unknown), stage fit, power, setup + soundcheck minutes, event fit (a settings map from event type to score), and audience fit (SAMPLE min/ideal/max per lineup).
   - Score with SAMPLE weights. Over-budget or a failed hard fit makes a lineup ineligible. Highest score wins; ties go to the lower cost.
   - If nothing is eligible, return `no_fit` with alternatives: a shorter set, removing optional items, or a polite decline. Never a discount.
   - Tests: a wedding with 150 guests and a 15k budget gives `quartet`; a 5k budget gives `no_fit`.
2. Extend `settingsSchema` + `SAMPLE_SETTINGS` with SAMPLE values, each flagged as sample:
   - per lineup: roles, stage size (2×2, 4×3, 8×5 m), setup + soundcheck (45/75/150 min), power needs, input list, stage plot positions, monitor mixes, audience min/ideal/max;
   - event-fit map and score weights;
   - business and MoMo details, terms, logo path.
3. `src/domain/rider/`: personnel, the input list, the stage plot model (metres, monitors, power drops), and the schedule worked back from the start time.
4. `supabase/migrations/…_settings.sql`: a `save_settings(data jsonb)` SECURITY DEFINER RPC that assigns the next version under a lock, plus a seed of SAMPLE settings v1. Use a script to insert `SAMPLE_SETTINGS` JSON, or generate the SQL from it; do not hand-copy numbers.
5. Settings UI at `/settings`: react-hook-form + Zod, grouped sections, SAMPLE DATA chips, and save → new version, logged to `activity_log`. Include tests.

### Phase 3: intake, transcription, extraction, brief review, clarification
- `/enquiries/new`:
  - paste text (≤ 20k) **or** a voice note (ogg/opus/m4a/mp3/wav/webm, ≤ 25 MB);
  - the voice note is uploaded straight from the browser to the `audio` bucket via a signed upload URL from `/api/upload-url`;
  - optional budget and received date;
  - the one primary action is "Analyse brief" with ScanText.
- `src/ai/`:
  - `client.ts`: groq-sdk, 429 retry, the AI_MODE switch.
  - `mock.ts`: fixture-matched output, else a deterministic regex extractor.
  - `transcribe.ts`: the server passes a short-lived signed URL to Groq.
  - `extract.ts`: system prompt with the enquiry in delimited data blocks; Zod output with `{key, value, status, source_quote, note}` per field.
  - `guards.ts`: `verbatimCheck`, `numbersSubsetOf`.
  - `clarify.ts`: follow-up draft and reply diff.
- Extracted fields: client name/contact, event type/date/start/end/hours, venue, location, outside Accra, travel km, indoor/outdoor, audience, budget, sound provided, power, stage size, sets, repertoire, special requests.
- Handle Pidgin, Twi words, "8k", "GHS", "7-10ish", and relative dates resolved **in code** against the received date in Africa/Accra. Ambiguous dates become `uncertain`.
- Brief review `/enquiries/[id]/brief`:
  - `ExtractedField` rows grouped under Client / Event / Production;
  - inline edit turns a field `confirmed` (who and when);
  - "Confirm all found";
  - required before pricing: date, duration, location, budget, sound provided;
  - "Continue with assumptions" is logged.
- Clarification: Friendly/Formal draft for missing and uncertain fields only; edit, copy, and open via `wa.me`. Paste the client's reply to get an AI diff the user accepts change by change. Confirmed fields are never overwritten (filtered on the server).
- `fixtures/test-briefs.json`: 20 briefs (clean, messy WhatsApp, Pidgin, missing details, conflicting, low budget, outside Accra, voice transcript, prompt injection) with expected fields.
- `scripts/eval-extract.ts` + `pnpm eval:extract`: per-field and overall accuracy, a failure list, and the mode in the header.
- Unit tests for the guards, dates and injection. E2E (mock) through the brief.

### Phase 4: lineup, quote builder, approval, versioning
- `/enquiries/[id]/lineup`: the `LineupComparison` component (three columns; a horizontal snap list below 1024px with the recommendation first).
  - The AI explanation (2–4 sentences) gets the facts only. Any number in it that is not in the facts → the template explanation.
  - Override needs a reason.
- `/enquiries/[id]/quote`:
  - edit inputs, and the engine recalculates on the server;
  - `QuoteSummary` with rule chips that expand to their trace;
  - manual lines and adjustments, each needing a reason;
  - audit log.
- `approve_quote(quote_id)` SECURITY DEFINER RPC: checks `can_approve()`, latest draft; locks the counter for the year (Africa/Accra); assigns `GD-YYYY-NNNN`; supersedes the prior approved version; logs it.
- `create_quote_version(quote_id)` RPC.
- `ApprovalBar` + a confirmation dialog summarising the total, deposit and changes.
- pgTAP tests: a non-approver fails, numbers are sequential, editing an approved quote creates v+1.

### Phase 5: PDFs
- `src/pdf/QuoteDocument.tsx` and `RiderDocument.tsx` (react-pdf, server-side, registered Geist + Inter TTFs, "Page X of Y").
- Drafts are watermarked "DRAFT – NOT APPROVED".
- The quote PDF has: branding, the `GD-YYYY-NNNN` number, items with traces, totals, deposit and balance with due dates, MoMo details, terms, and validity.
- The rider PDF has: personnel, an SVG stage plot (react-pdf `Svg`, shared data with the on-screen `StagePlot`), input list, monitors, power, backline, schedule, hospitality and contact.
- `/api/pdf/[quoteId]/[kind]/[mode]`: `preview` always works; `final` returns **409** unless the quote is approved, and stores the PDF in the `documents` bucket + table.
- A documents screen.
- Tests: the 409, the ₵ (or GHS fallback) text in the PDF, and the page count.

### Phase 6: overview and lists
- Overview: figures, "Needs attention" from queries (missing required fields, reply awaited, draft awaiting approval, quote expiring within 3 days, balance due within 7 days), recent enquiries, activity.
- Lists for enquiries, quotes and riders.
- Upcoming events: booked enquiries with event date ≥ today.
- Mark booked/lost.
- Delete an enquiry (with the anonymise rule).
- Sidebar counts from queries.

### Phase 7: QA and deploy
- Playwright with mock AI at 390 and 1440:
  - the full happy path to both PDFs;
  - export blocked before approval;
  - no horizontal overflow on every screen;
  - axe with no serious issues.
- Security pass: RLS, secrets, headers, input limits, the service key never in the client bundle.
- Hosted Supabase setup: migrations, buckets, the auth hook enabled in the dashboard, the magic-link template, redirect URLs.
- Vercel deploy with env vars.
- Root `README.md`: setup, architecture, AI boundaries, limitations.

Start with **Phase 2 (rest)**. Show the plan for that phase in 5–10 lines, then give the full steps and code.
