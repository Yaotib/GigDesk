# GigDesk: implementation plan

Status: Phase 0 (planning). No application code exists yet.
Sources read: `docs/README.md` (product README), `docs/GigDesk Design System/GigDesk Design System/` (brand book README, `tokens.json`, `tokens.css`, `components/bundle.css`, all 8 component READMEs and all 9 `preview.html` files, `api/*.md`, `manifest.json`), and the build prompt.

Order of authority when sources disagree: **build prompt > design system > product README**. Where that order is not enough to settle a conflict, it is listed under "Open questions" and is not decided here.

---

## 1. Repository layout

```
/
├─ CLAUDE.md                      rules + commands for agents
├─ README.md                      (Phase 7) setup, architecture, AI boundaries, limitations
├─ .env.example                   every env var, no values
├─ docs/
│  ├─ README.md                   product README (existing)
│  ├─ IMPLEMENTATION_PLAN.md      this file
│  └─ GigDesk Design System/      design system (source of truth for UI)
├─ fixtures/test-briefs.json      20 extraction fixtures with expected fields
├─ scripts/
│  ├─ eval-extract.ts             `pnpm eval:extract`
│  └─ seed-team.ts                seeds team_members from ALLOWED_EMAILS
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/                 schema, RLS, RPCs, triggers, storage buckets
│  └─ seed.sql                    SAMPLE settings v1
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/            magic-link form
│  │  ├─ auth/callback/route.ts
│  │  ├─ (app)/layout.tsx         AppShell (sidebar ≥768, top bar + bottom action bar <768)
│  │  ├─ (app)/page.tsx           Overview
│  │  ├─ (app)/enquiries/         list, new (intake), [id]/brief, [id]/lineup, [id]/quote, [id]/review
│  │  ├─ (app)/events/            upcoming events (filtered view of booked quotes)
│  │  ├─ (app)/quotes/            quotes & invoices list
│  │  ├─ (app)/riders/            production riders list
│  │  ├─ (app)/settings/          business settings (versioned)
│  │  └─ api/
│  │     ├─ upload-url/route.ts   signed upload URL for audio
│  │     └─ pdf/[quoteId]/[kind]/[mode]/route.ts   kind = quote|rider, mode = preview|final (409 if not approved)
│  ├─ components/
│  │  ├─ ui/                      shadcn primitives, restyled to tokens
│  │  └─ gd/                      AppShell, WorkflowSteps, ExtractedField, ProvenanceChip, LineupComparison,
│  │                              QuoteSummary, ApprovalBar, Money, StagePlot, SampleTag
│  ├─ domain/                     PURE TypeScript. No I/O, no React, no Supabase, no AI.
│  │  ├─ money.ts                 pesewas, round-half-up, percent (basis points), format GH₵
│  │  ├─ settings/schema.ts       Zod schema for settings
│  │  ├─ settings/sample.ts       SAMPLE seed (all values tagged sample: true)
│  │  ├─ pricing/                 engine.ts, rules/*.ts, types.ts
│  │  ├─ recommend/               scoring.ts, alternatives.ts, facts.ts
│  │  ├─ rider/                   schedule.ts, inputList.ts, stagePlot.ts
│  │  ├─ brief/                   field definitions, required-for-pricing, dates (Africa/Accra)
│  │  └─ __tests__/
│  ├─ ai/                         ONLY place that talks to Groq
│  │  ├─ client.ts                groq-sdk, 429 retry, AI_MODE switch
│  │  ├─ mock.ts                  deterministic mock provider
│  │  ├─ extract.ts               prompt + Zod output + verbatim guard
│  │  ├─ transcribe.ts            whisper-large-v3-turbo
│  │  ├─ clarify.ts               follow-up draft, reply-diff suggestion
│  │  ├─ explain.ts               lineup explanation + number guard + template fallback
│  │  └─ guards.ts                verbatimCheck(), numbersSubsetOf()
│  ├─ server/                     server actions, data access (Supabase server client), auth helpers
│  ├─ pdf/                        @react-pdf/renderer documents: QuoteDocument, RiderDocument, fonts
│  └─ styles/globals.css          tokens.css + Tailwind @theme mapping
└─ e2e/                           Playwright specs (390px and 1440px projects)
```

---

## 2. Data model (Supabase Postgres)

RLS is enabled on every table. Policies allow access only when `is_team_member()` is true (the caller's `auth.email()` is in `team_members`). The service role is used only by seed scripts and never reaches the browser.

| Table | Purpose / key columns |
| --- | --- |
| `team_members` | `email` PK, `user_id`, `display_name`, `can_approve bool`. Seeded from `ALLOWED_EMAILS` by `scripts/seed-team.ts`. |
| `settings_versions` | `id`, `version int unique`, `data jsonb` (Zod-validated), `created_by`, `created_at`. Insert-only. Current = highest version. |
| `enquiries` | `id`, `status` (new · needs_info · ready_to_price · quoted · approved · booked · lost), `source` (text · voice), `raw_text`, `audio_path`, `transcript`, `transcript_confirmed_by/at`, `received_date`, `budget_pesewas`, `created_by`, timestamps. |
| `brief_fields` | `enquiry_id`, `key`, `value jsonb`, `status` (found · uncertain · missing · confirmed), `source_quote`, `note`, `origin` (ai · user · reply), `confirmed_by/at`. Unique (`enquiry_id`, `key`). |
| `clarifications` | `enquiry_id`, `tone` (friendly · formal), `draft_text`, `reply_text`, `suggested_changes jsonb`, `accepted_keys text[]`. |
| `lineup_decisions` | `enquiry_id`, `facts jsonb` (engine output), `recommended`, `selected`, `override_reason`, `explanation`, `explanation_source` (ai · template). |
| `quotes` | `id`, `enquiry_id`, `version int`, `status` (draft · approved · superseded), `settings_version_id`, `inputs jsonb`, `result jsonb` (lines with rule ids + traces, totals), `total_pesewas`, `deposit_pesewas`, `balance_pesewas`, `quote_number` (unique, null until approved), `approved_by/at`. Unique (`enquiry_id`, `version`). |
| `quote_number_counters` | `year int` PK, `last int`. Locked `FOR UPDATE` inside the approval RPC. |
| `riders` | `quote_id`, `schedule jsonb` (arrival, setup, soundcheck, sets), `hospitality`, `contact`, `notes`. |
| `documents` | `quote_id`, `kind` (quote · rider), `final bool`, `storage_path`, `created_by/at`. |
| `activity_log` | `entity_type`, `entity_id`, `action`, `actor`, `payload jsonb`, `at`. Written for confirmations, "Continue with assumptions", overrides, manual lines, adjustments, approvals, exports, booked/lost, deletions. Insert-only. |

**Database guarantees**
- `approve_quote(quote_id)` RPC, `SECURITY DEFINER`: checks the caller is a team member with `can_approve`; checks the quote is the latest draft; locks the year counter (year from the approval time in Africa/Accra); assigns `GD-YYYY-NNNN`; sets `approved_by/at`; marks the previously approved version `superseded`; writes the activity log. All in one transaction.
- Immutability trigger on `quotes`: rejects any UPDATE to a row whose `status = 'approved'` except the single transition `approved → superseded`. Superseded rows reject all updates. Edits go through `create_quote_version()`, which copies the inputs into a new draft row.
- `settings_versions` and `activity_log`: UPDATE and DELETE are revoked.

**Storage** (all private, signed URLs only): `audio` (browser uploads straight here via signed upload URL, ≤ 25 MB, ogg/opus/m4a/mp3/wav/webm), `documents` (final PDFs), `branding` (logo).

---

## 3. Domain engines (pure TypeScript)

### 3.1 Money
- All amounts are integer pesewas (`GH₵1 = 100`). No floats anywhere in money paths.
- Percentages are stored as basis points (`5% = 500`). `percentOf(amount, bp) = roundHalfUp(amount × bp / 10000)` using integer arithmetic.
- `deposit + balance = total` always: `balance = total − deposit`, never computed separately.
- Display: `GH₵12,450.00` (no space, two decimals, leading minus for negatives, never red). **Geist and Geist Mono have no ₵ glyph** (verified in Phase 1, `tests/fonts.test.ts`). The web loads Inter's latin-ext subset as a per-glyph fallback. The PDF must do the same (react-pdf font fallback to Inter) or print `GHS`; verified in Phase 5.

### 3.2 Pricing rules
Every line carries a rule id and a mono trace string.

| Rule | Line | Formula (SAMPLE rates from settings) |
| --- | --- | --- |
| R-01 | Artist fee | lineup artist fee |
| R-02 | Musician fees | musicians × musician fee |
| R-03 | Extra hours | max(0, hours − included) × extra-hour rate × **performers** (artist + musicians) |
| R-04 | Rehearsal | rehearsal hours × rate × **musicians** (artist excluded) |
| R-05 | PA | audience tier rate, only if the venue has no sound |
| R-06 | Engineer | flat fee, **always** charged (band's own engineer) |
| R-07 | Transport | inside Accra: zone rate × vehicles · outside Accra: km × 2 × per-km rate × vehicles |
| R-08 | Accommodation | rate × **travel party** × nights |
| R-09 | Per diem | rate × **travel party** × days |
| R-10 | Generator | flat, when toggled |
| R-11 | Backline | configured items, when toggled |
| M-nn | Manual line | reason required (Zod rejects without one) |
| A-nn | Adjustment | reason required; total may not go below 0 |
| T-nn | Tax lines | each = percentOf(subtotal, bp), non-compounding; disabled by default, labelled "TBC – confirm with accountant" |
| D-01 | Deposit | percent of total (round half up) or fixed amount capped at total |

Then: total = subtotal + taxes; balance = total − deposit; deposit due on acceptance; balance due 7 days before the event (if that date has passed, due immediately and flagged); quote valid 14 days from approval.

**Rules derived from the required tests (please confirm they match how the band works):**
- S3 gives an extra hour of 1,400.00 = 1 h × 350 × **4**, so extra hours count the artist as well as the musicians, but not the engineer.
- S1 gives a subtotal of 14,250.00 only if rehearsal = 3 h × 150 × **3** (the artist is excluded) and the PA tier for 120 guests is **medium**.
- S4 reaches 54,800.00 only if the engineer is charged even when the venue has sound, and the travel party for accommodation and per diem is **12** (artist + 10 musicians + engineer):
  6,000 + 15,000 + 6,000 rehearsal + 800 engineer + 15,000 transport (250 × 2 × 10 × 3) + 7,200 accommodation + 4,800 per diem.
- The audience-tier limits are not given anywhere. SAMPLE values: small ≤ 100, medium 101–300, large > 300 (these keep S1 at medium).
- Transport is zone rate × vehicles. S1 cannot tell this apart from a flat zone rate, because the quartet uses one vehicle.

**Hand-checked results:** S1 = 4,000 + 4,500 + 1,350 + 3,000 + 800 + 600 = 14,250.00 → 7,125.00 / 7,125.00. S2 taxes = 712.50 + 356.25 = 1,068.75 → total 15,318.75 → deposit 7,659.38 / balance 7,659.37. S3 = 15,650.00. S4 = 54,800.00. All four agree with the prompt.

### 3.3 Recommendation
- For each lineup, the engine computes: estimated total (a real `price()` run), budget fit (within · stretch ≤ +10% · over · unknown), stage fit, power, setup + soundcheck time, event fit (settings map from event type to score per lineup) and audience fit (SAMPLE min/ideal/max audience per lineup).
- The score is a weighted sum with SAMPLE weights from settings. A lineup that is over budget, or that fails a hard fit such as the stage, is not eligible. The highest score wins, and ties go to the lower cost.
- If no lineup is eligible, the result is `no_fit` with alternatives: a shorter set, removing optional items (generator, backline, PA if the client can provide sound), or a polite decline. It never offers a discount.
- The AI explanation gets only the computed `facts` object. A guard pulls every number out of the AI text, and if any number is not in the facts, the stored explanation is the deterministic template.
- An override needs a reason and is logged.
- Tests: a wedding with 150 guests and a 15k budget gives the quartet; a 5k budget gives `no_fit` (even the cheapest duo setup, 5,700.00, is above the 5,500.00 stretch limit).

### 3.4 Rider model
From the selected lineup in the settings snapshot: personnel, stage plot (positions in metres on the stage grid, monitors, power drops), input list, monitor mixes, power, backline, schedule (arrival, setup, soundcheck, sets, worked back from the start time using the lineup's setup time), hospitality and contact. The same `StagePlot` data feeds the on-screen SVG and the react-pdf `Svg`.

### 3.5 Settings
One Zod schema. Every SAMPLE value is tagged `sample: true`, so the UI shows the `SAMPLE DATA` chip until someone changes it. Saving inserts a new `settings_versions` row. Quotes store `settings_version_id`, so an old quote always reprices the same way.

---

## 4. AI boundary (Groq)

| Task | Model | Guard |
| --- | --- | --- |
| Transcription | `GROQ_STT_MODEL` (whisper-large-v3-turbo); the server passes a short-lived signed Storage URL | The transcript is editable and must be confirmed before extraction |
| Extraction | `GROQ_MODEL` (default `openai/gpt-oss-120b`, changed by the user from llama-3.3-70b-versatile on 2026-11-27), JSON output, temperature 0 | Zod schema; `source_quote` must be an exact substring of the input (only CRLF→LF normalised), or the field becomes `uncertain`; no quote means `missing`; relative dates are resolved in code against `received_date` (Africa/Accra), and ambiguous dates become `uncertain` |
| Follow-up draft | same | Only for missing/uncertain keys; it stays a draft that the user copies or opens via `wa.me` |
| Reply diff | same | Each change needs a verbatim quote from the reply; confirmed fields are dropped on the server; the user accepts changes one by one |
| Lineup explanation | same | Gets facts only; any number not in the facts → template |

- The enquiry text goes inside clearly delimited data blocks, and the system prompt says it is untrusted data. The model has no tools, and none of its outputs can trigger an action.
- On a 429, the client retries twice with backoff (honouring `retry-after`) and then shows "The AI service is busy. Try again in a minute. Your text is saved."
- `AI_MODE=mock` swaps in `ai/mock.ts`: it returns a fixture's expected output when the input matches a fixture, and otherwise a small deterministic regex extractor. Unit tests and E2E always run in mock mode.
- `pnpm eval:extract` runs the 20 fixtures in live mode, reports per-field and overall accuracy with the failures listed, and prints the mode in its header. A mock-mode run is labelled as not meaningful.

---

## 5. UI mapping to the design system

- `tokens.css` is imported as-is. Tailwind `@theme` maps every token (colours, radii 4/6/10, spacing, type styles, shadows, breakpoints 640/768/1024/1280). The shadcn CSS variables (`--primary`, `--ring`, `--radius` …) point at these tokens. Pill radii, gradients and default shadows are removed.
- Fonts: Geist and Geist Mono (the `geist` package via `next/font`), with Inter as the fallback; mono + `tabular-nums` for every figure through `<Money>` and a `.figure` utility.
- Icons: lucide-react only, 16px/20px, stroke 1.75. A lint rule (`no-restricted-imports`) blocks `Sparkles`. ScanText is used for AI-read and "Analyse brief".
- Primary button: one per view. On mobile it lives in the bottom action bar. Controls are 44px below 768px and 36px above.
- Provenance chips: AI-read (dotted underline + ScanText), Check, Missing, Confirmed, R-nn (expands to its trace), Manual + reason, SAMPLE DATA.
- WorkflowSteps on every enquiry screen: 01 Brief · 02 Lineup · 03 Price · 04 Review & export. Clarification lives inside 01 Brief.
- The Overview has no AI. "Needs attention" comes from queries: missing required fields, a reply waiting to be pasted, a draft waiting for approval, a quote expiring within 3 days, a balance due within 7 days.
- Nav and icons follow the brand book: Overview `LayoutDashboard`, Enquiries `Inbox`, Upcoming events `CalendarDays`, Quotes & invoices `FileText`, Production riders `Music2`, Business settings `Settings`.

---

## 6. Phases and exit criteria

Each phase ends with a report: files changed, tests run with results, and gaps. The next phase does not start until the current one passes.

| # | Scope | Exit criteria |
| --- | --- | --- |
| 0 | Read docs, this plan, `CLAUDE.md`, `.gitignore`, `.env.example` | User approves the plan and answers the open questions |
| 1 | pnpm via corepack; Next.js 15 + TS strict; Tailwind + shadcn mapped to tokens; Geist fonts; ₵ glyph check (web + react-pdf); AppShell (sidebar ≥768, top bar + menu sheet + bottom action bar <768); local Supabase (Docker), migrations for all tables, RLS, storage buckets; magic-link auth with allowlist; `seed-team`; Vitest + Playwright scaffolding; lint, typecheck | `pnpm typecheck lint test` green; logging in works locally; a non-allowlisted email is refused; RLS tests prove that anon and non-members read nothing |
| 2 | money, settings schema + SAMPLE seed, pricing engine, recommendation engine, rider model, Settings UI (versioned, SAMPLE chips) | S1–S4 exact; manual line without a reason rejected; fixed deposit capped; 200 generated cases where deposit + balance = total; both recommendation tests pass; editing settings creates a new version |
| 3 | Intake (paste ≤ 20k, voice upload/record → signed upload → transcribe → edit → confirm, budget, received date); extraction with guards; brief review (groups, inline confirm, "Confirm all found", required-for-pricing gate, "Continue with assumptions" logged); clarification (Friendly/Formal, copy, wa.me, reply diff); 20 fixtures; `eval:extract` | Guard unit tests (fake quote → uncertain, injection fixture ignored); mock E2E through the brief; live eval run, with the honest accuracy number reported |
| 4 | Lineup screen (comparison, explanation, override with reason); quote builder (inputs → engine → summary with traces, manual lines, adjustments, audit log); approval dialog + `approve_quote` RPC; versioning; immutability trigger | SQL tests: an update to an approved quote fails; approval by a non-approver fails; numbers are sequential per year; editing an approved quote creates v+1 |
| 5 | Quote/Invoice PDF and Rider PDF (react-pdf, server-side, Geist, "Page X of Y", DRAFT watermark, SVG stage plot); preview and final routes; documents screen | Final route returns 409 before approval; PDFs render ₵ correctly; snapshot test of the PDF text content |
| 6 | Overview (figures, needs attention, recent enquiries, activity), enquiries/quotes/riders lists, upcoming events, mark booked/lost, delete enquiry | Query unit tests for needs-attention; E2E for the lists |
| 7 | Playwright at 390 and 1440 (happy path to both PDFs, export blocked before approval, no horizontal overflow, axe with no serious issues); security pass (RLS, secrets, headers, input limits); Vercel deploy; README | All E2E green; deployed URL works against hosted Supabase; README done |

---

## 7. Conflicts and gaps found

### Resolved by the build prompt (it outranks the design system)
1. **AI icon.** The design system uses `Sparkles` for AI-read, for "Analyse brief" and for the Recommended label. The build prompt (rule 10) says to use `ScanText`. → ScanText everywhere AI output appears.
2. **Preview figures.** The QuoteSummary and LineupComparison previews use made-up rates (rehearsal GH₵200, duo GH₵6,800, full band GH₵38,900, "4 musicians × 1,125"). They are illustrations only. → The prompt's SAMPLE table is the data.
3. **Stack.** The README lists "Supabase / SQLite" and a generic "LLM API". → Supabase + Groq, as the prompt decides.
4. **Data gaps that need SAMPLE values** (labelled SAMPLE, editable in Settings): audience tiers, the Accra zone definitions (the user picks A/B/C), the lineup roles and instruments, stage sizes (from the design preview: 2×2, 4×3, 8×5 m), setup + soundcheck times (45/75/150 min), power needs, input lists, the stage plots, event-fit and audience-fit maps, score weights, MoMo/business details, terms. A real Susan Augustt business detail is never presented as fact.

### Decided by the user (2026-11-27)
- **D1. The "Recommended" label** carries no AI icon: the lime top rule plus an `accent-ink` "Recommended" label. ScanText appears only on the AI-written explanation underneath.
- **D2. Deleting an enquiry that has an approved quote** anonymises the client details and keeps the quote rows and invoice numbers. Enquiries that never had an approved quote are hard-deleted. Both cases are written to the activity log without personal data.
- **D3. Quote vs invoice:** one document. It is titled "Quote" until the enquiry is marked booked and "Invoice" after that, with the same `GD-YYYY-NNNN` number and the same figures.

### Still open (non-blocking)
- **Q4. Demo time target.** The README says under 3 minutes and the prompt pitch says under 5. Proposal: "under 5 minutes" as the product claim and "under 3 minutes" as the demo walkthrough target in the README.

### Environment notes
- pnpm is not installed; Phase 1 runs `corepack enable pnpm`.
- Docker 29 and the Supabase CLI 2.107 are installed, so dev and E2E use local Supabase. A hosted Supabase project and a Groq API key are needed by Phase 3 (the live eval) and Phase 7 (deploy). I will ask for them then, and they go only into `.env.local` and Vercel.
- The Vercel CLI is not installed. Deployment can go through the Vercel dashboard GitHub integration or `pnpm dlx vercel`.
- The design system folder is untracked in git. It should be committed, because it is the UI source of truth. It contains no secrets.
- Next.js 15 is pinned as the prompt decided, even though newer majors exist.
