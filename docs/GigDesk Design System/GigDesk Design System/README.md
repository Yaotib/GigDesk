# GigDesk — design system

GigDesk turns a messy event enquiry into an approved quote, an invoice and a venue rider for Susan Augustt and the Adorkor Band. The interface should feel like a precise financial tool made by people who also run a stage: calm, exact and quietly musical. It is not a streaming app or a generic AI dashboard.

## Principles

1. **Show where everything comes from.** Every value tells you its source: the AI read it, the team confirmed it, or a rule calculated it. This provenance system (below) is the core of the product's visual language.
2. **The team stays in control.** AI output looks provisional until a person confirms it. Export stays locked until someone approves.
3. **Money reads like money.** Figures are set in Geist Mono with tabular numerals and right-aligned. The total and the deposit are always the most prominent numbers on the page.
4. **Phone first, desk second.** Build every screen at 375px first, with 44px controls and one primary action pinned in reach of the thumb. Desktop adds width, not new features.
5. **Earn every element.** Group content with dividers, whitespace and type, not boxes. Use a panel only when content needs a surface, and never nest cards.

## Voice

Write in plain, short sentences that a booking manager would say out loud. Use "Deposit due", not "Accounts receivable". Buttons start with a verb and use sentence case: "Analyse brief", "Draft follow-up", "Approve quote". Never use exclamation marks or emoji. AI copy speaks in the third person about the brief ("The brief doesn't mention power at the venue") and never claims certainty it doesn't have.

## Colour

- `canvas` is the page ground and `surface` holds tables, forms and documents. `ink` carries text, and `ink-muted` carries secondary text.
- **Lime (`accent`) is a fill, never text on light grounds** (contrast 1.2:1). Use it only for the primary button, the active-nav marker, the "Recommended" rule on a lineup and the progress of the current step. For lime-coloured meaning on light grounds, use `accent-ink` text on `accent-soft`.
- The sidebar is the one dark area: `sidebar`, `sidebar-ink`, `sidebar-muted`, plus lime for the active marker.
- Signal colours always come in pairs, with text on the matching soft ground: `success`/`success-soft`, `warning`/`warning-soft`, `danger`/`danger-soft`. They mean state, never decoration.
- Changes from the original brief, made for accessibility: `#777D78` is kept as `ink-subtle` but only reaches 4:1 on canvas, so body secondary text uses `ink-muted` `#636963` instead. Control borders use `line-control` (3.5:1), because `line` (`#E7E9E4`) is too faint to outline an input. The focus ring is `focus` (ink), because a lime ring disappears on canvas.

## The provenance system

| State | Looks like | Used for |
| --- | --- | --- |
| **AI-read** | Value in `ink` with a dotted `line-control` underline; Lucide `Sparkles` 16px in `ink-muted` | A field the AI extracted that no one has confirmed yet |
| **Uncertain** | `warning` chip "Check" on `warning-soft`; Lucide `CircleHelp` | Conflicting or vague source text |
| **Missing** | `danger` chip "Missing" on `danger-soft`; Lucide `CircleAlert`; value area empty | A required field that is absent from the brief |
| **Confirmed** | Value in `ink`, solid underline removed; `success` Lucide `CircleCheck` | Edited or approved by a team member |
| **Calculated** | Figure in Geist Mono plus a `surface-sunken` tag "R-04" that expands to the rule trace | Any amount made by the pricing engine |
| **Manual** | Figure in Geist Mono plus an `ink-muted` tag "Manual" and a reason line | A line item a person added or overrode |

Dotted means "a machine thinks so". Solid means "a person or a rule stands behind it". Never use a glow, gradient or purple to signal AI.

## Type

- **Geist** for the interface and **Geist Mono** for every amount, quantity, rate, date-time in tables, rule ID and step number (both are on Google Fonts; Inter is the fallback).
- Use six interface sizes: `page-title` 24/32, `section-title` 16/24, `body` 14/20, `body-strong`, `small` 13/18 and `label` 12/16. Never use anything larger than 24px in the app. The only larger figure is `figure-total` (24px mono) on the quote.
- Weights are 400, 500 and 600 only.
- Section labels are `label` in `ink-muted`, sentence case. Don't use all-caps tracking.

## Space, shape and depth

- Use a 4px grid: `space-1` 4 … `space-12` 48. Panels get `space-6` padding on desktop and `space-4` on mobile.
- Use three radii: `radius-sm` 4 for chips, `radius-md` 6 for controls and `radius-lg` 10 for panels. Don't use pills or anything rounder.
- Flat by default. `shadow-doc` is used only for the A4 previews, and `shadow-overlay` only for menus and dialogs.

## Layout

- **Desktop (≥1024):** a fixed 232px dark sidebar, with content on canvas up to a `content-max` width of 1200px. The page header has the title on the left and at most one primary action on the right. The quote builder and document preview sit side by side from 1280px.
- **Mobile (<768):** a dark top bar with the page title, and a bottom bar holding the single primary action ("Analyse brief", "Approve quote"). Tables become stacked rows with the amount right-aligned. Lineup columns become a horizontal snap list of three, with the recommendation first.
- **The workflow strip:** 01 Brief · 02 Lineup · 03 Price · 04 Review & export. It is numbered like a set list in Geist Mono and sits under the page header on every enquiry screen.

## Iconography

Use Lucide React only, at 16px (`icon-sm`) inline and 20px (`icon-md`) in nav and headers, with a stroke of 1.75 and the colour inherited from the text. Never use emoji, Unicode arrows or text glyphs as icons.

Nav icons:

| Item | Icon |
| --- | --- |
| Overview | `LayoutDashboard` |
| Enquiries | `Inbox` |
| Upcoming events | `CalendarDays` |
| Quotes & invoices | `FileText` |
| Production riders | `Music2` |
| Business settings | `Settings` |

Workflow icons:

| Meaning | Icon |
| --- | --- |
| AI-read | `Sparkles` |
| Voice note | `Mic` |
| Lineup | `Users` |
| Approve | `ShieldCheck` |
| Export | `Download` |
| Draft follow-up | `MessageSquareText` |

## Money

Show **GH₵** before the amount with no space and two decimals, for example `GH₵12,450.00`. Negative amounts take a leading minus and are never shown in red. Subtotal, tax lines and total each sit on their own row, with a hairline above the total. Deposit and balance always appear together, directly under the total, each with its due date.

## Sample data

Every demo value carries a `SAMPLE DATA` tag in `label` style on `warning-soft`. Rates, tax lines and terms are placeholders until Susan's team and accountant confirm them.

## Don't

- Use gradients, glassmorphism, glows, blurred blobs or decorative shapes.
- Put a card inside a card or give every section a card.
- Use lime as text on a light ground, or as a large background.
- Use emoji, or use pill-shaped buttons.
- Use more than one primary (lime) button per view.
- Use an AI chat-bubble UI. AI output appears as fields, chips and short notes in the flow of the form.
