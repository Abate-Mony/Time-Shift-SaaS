# OnClockly — Figma Brief: Quote Workflow Builder

## 1. Project Overview

Design the **Quote Workflow Builder** — a Settings screen inside OnClockly (the existing company admin dashboard) where a company owner/admin builds the question set their own public quote-request wizard asks visitors.

This is **not** the public-facing wizard itself. It's the internal tool an OnClockly customer uses to configure that wizard — add questions, choose their type, set options and prices, reorder them, and publish changes live.

It lives at:

```text
Settings → Quote Workflow
```

inside the existing dashboard (sidebar already present, same shell as every other Settings tab — Profile, Company, Notifications, Email & Sending, API Keys, Quote Link, Billing).

---

## 2. Important Product Context

OnClockly is a workforce-management SaaS. One feature lets a company share a public link (`quotes.onclockly.com/<their-link>`) where a visitor fills in a short wizard and becomes a lead in the company's CRM.

Different companies do different work — a cleaning company's quote form asks about bedrooms and extras; a security company's asks about site type and guard hours; a care company's asks about level of care needed. Rather than a developer hand-coding each company's question set, **the company itself builds and edits its own wizard** through this screen.

A new company starts from one small seeded example (not a big template) and edits/adds/deletes from there.

---

## 3. Very Important Constraints (v1 — do not design around these)

- **No conditional branching.** Each "service type" (e.g. "Home Cleaning", "Carpet Cleaning") is one straight ordered list of questions. The only branch point a visitor ever sees is picking which service type at the start. Don't design an "if this then skip that" condition builder.
- **Pricing is additive only.** `estimatedPrice = basePrice + sum of selected options' price adjustment`. No formulas, no "price per bedroom × rate" — just a base price plus an optional flat £ amount per option. Don't design a formula/expression editor.
- **Draft vs Published.** Every edit here changes a **draft**. The public wizard only ever shows the last **published** version. Edits never go live instantly — there's always an explicit "Publish" step. This is the most important interaction pattern in the whole screen; get it right.

---

## 4. The Underlying Data Model (design must map onto this exactly)

```text
QuoteWorkflow (one per company)
├── draft
│   └── serviceTypes[]
│         ├── key, label, description, icon
│         ├── order, active
│         ├── basePrice
│         ├── requiresManualQuote   (true = never shows an instant price, always "we'll be in touch")
│         └── steps[]
│               ├── id, type, label, subtitle, placeholder, helpText
│               ├── required, order, active
│               ├── options[]        (choice / multiselect only)
│               │     └── label, value, priceDelta, order
│               └── numberConfig     (number only)
│                     └── min, max, step, pricePerUnit
├── published            (same shape as draft, or null if never published)
└── publishedAt
```

**Step types** (this is the dropdown in point 6 below):

```text
choice        — pick one from a list of options
multiselect   — pick any number from a list of options
number        — a number picker (min/max/step), optionally priced per unit
text          — single-line text
textarea      — multi-line text
date          — a date picker
contact       — a fixed name/email/phone/marketing-consent block (always the last step)
```

`active: false` on a service type or step means "hidden from the public wizard, but not deleted" — this is how an admin temporarily turns something off without losing its content. Design a clear way to represent this (toggle, not a separate archive screen).

---

## 5. Design Direction

### Overall style

Match the **existing OnClockly dashboard** exactly — this is not a new product, it's one more Settings page. Reference points already built in this same app:

- Settings pages generally: card-based sections, `max-w-3xl` centered content, clean white cards with a thin border, generous padding.
- **API Keys settings page** — closest existing analog. A list of items (keys), a "New key" button, each row showing name + metadata + a destructive action behind a confirm step. The Quote Workflow builder's "Service types" list should feel like a sibling to this.
- **Quote Link settings page** — shows how this app handles "here's your public link, copy it, regenerate it" patterns, useful for the Preview/publish area.

Keep it clean, functional, information-dense but calm — this is an internal admin tool, not a marketing page. No heavy illustration, no gradients, no marketing copy.

### Theme

Light mode, matching the rest of the dashboard. Reuse the app's existing tokens rather than inventing new colors:

```text
Background: app's existing card/background tokens
Primary action: the app's existing primary/accent color
Draft indicator: amber/warning tone
Published indicator: emerald/success tone
Destructive actions: red, behind a confirm step (never one-click)
```

---

## 6. Screen 1 — Service Types List

Route (conceptually): `Settings → Quote Workflow`

### Header

```text
Quote Workflow
Build the questions your public quote form asks — add, edit, or remove
questions, then publish when you're ready.
```

A clear **draft/published status strip** near the top:

```text
● Unpublished changes          [Preview]  [Publish changes]
```

or, if nothing's changed since last publish:

```text
✓ Up to date — last published 2 days ago          [Preview]
```

This status strip is visible on every screen in this feature, not just this one — it's how the admin always knows whether visitors can currently see their edits.

### Service type cards

A list (not a table — these are few, chunky items) of service-type cards, each showing:

```text
[drag handle]  [icon]  Home Cleaning                    [●Active ⌄]
               Regular domestic cleaning
               12 questions · from £80
                                              [Edit steps]  [⋯]
```

The `[⋯]` menu: Edit details, Duplicate, Deactivate (not delete — keep it non-destructive first), Delete (behind a typed-confirm for anything with real content).

`+ Add service type` button, prominent, top-right of the card list.

### Empty state

A brand-new company before anything's been added (rare, since seeding happens automatically, but design it anyway):

```text
No service types yet.
[+ Add your first service type]
```

---

## 7. Screen 2 — Add / Edit Service Type (modal)

Small, focused modal:

```text
Service type

Label            [ Home Cleaning                    ]
Key (url-safe)   [ home-cleaning                     ]  auto-filled from label, editable
Description      [ Regular domestic cleaning         ]
Icon             [ icon picker — small grid, optional ]
Base price       [ £ 80                              ]
Instant pricing  ( ) Show an instant estimate
                 ( ) Always say "we'll review and get back to you"
                       (use this for enquiry-only services, e.g. commercial contracts)

                                      [Cancel]  [Save]
```

---

## 8. Screen 3 — Step Builder (per service type)

Reached via "Edit steps" on a service-type card. This is the **main working screen** — spend the most design effort here.

### Header

```text
← All service types
Home Cleaning — Steps                              [+ Add step]
```

### Step list

Ordered, draggable rows:

```text
[⠿]  [icon: choice]   What type of property is it?              [Required] [⋯]
[⠿]  [icon: number]   How many bedrooms?            +£20/unit    [Required] [⋯]
[⠿]  [icon: multi]    Would you like any extras?     4 options   [Optional] [⋯]
[⠿]  [icon: text]     Street address                             [Optional] [⋯]
[⠿]  [icon: contact]  Contact details                            [Required] [⋯]  (locked to last position)
```

Each row:
- Drag handle (`⠿`) on the far left for reordering
- A small icon indicating step type (distinct icon per type — choice / multiselect / number / text / textarea / date / contact)
- The question label as the main text
- A compact secondary hint: option count, or `+£X/unit` for number steps with pricing, or nothing for plain text/date
- Required/Optional badge
- `[⋯]` row menu: Edit, Duplicate, Deactivate, Delete

Inactive steps appear visually muted/greyed (not hidden) with an "Inactive" label, so the admin can still find and re-enable them.

The **contact** step is special: every service type has exactly one, it's always the last step, and it cannot be deleted or reordered away from the end (it can still be edited — label/subtitle — just not moved or removed). Show it visually pinned at the bottom, without a drag handle.

---

## 9. Screen 4 — Add / Edit Step (modal or side panel)

This is the most detail-heavy screen — the actual question editor.

### Shared fields (every type)

```text
Question type    [ dropdown: Single choice / Multiple choice / Number /
                    Short text / Long text / Date ]
Label            [ How many bedrooms?                            ]
Subtitle         [ optional helper text under the question       ]
Required         ( ) Yes   ( ) No
```

### Type-specific fields (shown/hidden based on the dropdown above)

**Single choice / Multiple choice:**

```text
Options
  [⠿]  Flat / Apartment              £0      [×]
  [⠿]  Terraced house                £0      [×]
  [⠿]  Detached house                £0      [×]
  [+ Add option]
```

Each option row: drag handle, label text field, a small `£` price-adjustment field (defaults to 0, can be hidden/collapsed if the admin never touches it — don't force pricing complexity on someone who just wants a plain question), delete.

**Number:**

```text
Minimum    [ 1  ]      Maximum   [ 6  ]      Step  [ 1  ]
Price per unit  [ £20 ]   (optional — leave blank for no pricing impact)
```

**Short text / Long text:**

```text
Placeholder    [ e.g. 14 Example Road, Chippenham  ]
Help text      [ optional — small text shown under the field      ]
```

**Date:** no extra fields beyond the shared ones.

### Live preview

A small, real preview pane on the right (or below, on narrower screens) showing exactly how this question will render to a visitor — using the *actual* wizard's visual style, not a mockup. This is important: the admin should never be surprised by what ships. Update it live as they type.

```text
[Cancel]                                          [Save step]
```

---

## 10. Screen 5 — Preview Mode

Triggered by the `[Preview]` button in the status strip (available from any screen in this feature).

Opens the **real public wizard**, running against the current **draft** (not published) content, in an obvious "preview" frame so it's never confused with the live form:

```text
┌─────────────────────────────────────────────────┐
│  PREVIEW — this is your draft, not what's live   │       [Exit preview]
├─────────────────────────────────────────────────┤
│                                                   │
│         [ the actual quote wizard renders here ] │
│                                                   │
└─────────────────────────────────────────────────┘
```

No real lead gets created from a preview submission — make that explicit somewhere in this frame (e.g. "Submitting here won't create a real lead").

---

## 11. Screen 6 — Publish Confirmation

Triggered by `[Publish changes]`. A confirmation modal, not a silent action — publishing immediately changes what every visitor to the public link sees.

```text
Publish changes?

This updates your live quote form immediately. Anyone opening your
quote link after this will see the new questions and pricing.

Changed since last publish:
  • Home Cleaning — added 1 question, changed pricing on 2 options
  • Carpet Cleaning — 1 question deactivated

                                    [Cancel]   [Publish now]
```

The changed-summary doesn't need to be a deep diff — a simple per-service-type "what changed" line is enough.

---

## 12. Components to Create

```text
StatusStrip              (draft/published indicator + Preview/Publish actions)
ServiceTypeCard
ServiceTypeModal         (add/edit)
StepRow                  (draggable list item)
StepTypeIcon             (one icon per step type, consistent set)
StepEditorModal/Panel
OptionRow                (draggable, label + price + delete)
NumberConfigFields
LivePreviewPane
PublishConfirmModal
EmptyState
ConfirmDeleteDialog      (typed-confirm for anything with real content, matches
                           the app's existing destructive-action pattern)
```

---

## 13. States to Design

```text
Empty            — no service types yet (rare, auto-seeded, but design it)
Loading          — skeleton versions of the service-type list and step list
Saving           — inline spinner on Save buttons, not a full-page block
Unpublished      — status strip shows "Unpublished changes"
Up to date       — status strip shows last-published time
Error            — a save/publish failure shows inline, never a silent failure
Inactive step/service type — visually muted, clearly labeled, not hidden
```

---

## 14. Responsive Behaviour

Primary target: **desktop**, same as the rest of Settings (1280–1440px). This is an admin configuration tool, not something typically used on a phone. Still make it usable down to tablet width (~1024px) — the step editor's live-preview pane can stack below the form instead of sitting beside it. Mobile is not a priority.

---

## 15. What NOT to Design

- No conditional branching / "show this question if..." logic.
- No pricing formulas — flat £ adjustments only.
- No drag-and-drop between service types (steps belong to one service type only).
- No multi-language / translation UI.
- No analytics/reporting on the quote form (that's a different, already-separate part of the product).
- No redesign of the public wizard itself — only reference its visual style for the live preview.

---

## 16. Final Design Review Checklist

- Is it immediately clear this edits a **draft**, and that publishing is a separate, deliberate step?
- Can an admin add a brand-new question in under 30 seconds without reading instructions?
- Is reordering (steps and options) obviously drag-and-drop?
- Does the step-type dropdown make it obvious what each type means before picking it?
- Is the live preview actually trustworthy — would what's shown match what ships?
- Is every destructive action (delete step, delete service type) behind a confirmation, consistent with how the rest of OnClockly handles deletions?
- Does it look like it belongs in this dashboard, not like a separate tool bolted on?
