# `src/pages/marketing/`

The public, logged-out marketing/landing page for INPRN — everything a
visitor sees **before** they sign up or log in. Lives completely outside
the authenticated app: no `DashboardLayout`, no auth check, no API calls
that need a session.

## Where it lives

| What | Where |
|---|---|
| Page | `src/pages/marketing/MarketingHome.tsx` |
| Route | `/welcome` (registered in `src/utils/routes.tsx`, as a bare child of `RootLayout` — same level as `/invite`, `/q/:token`) |
| Backend data | `GET /api/v1/plans` (public, no auth — see below) |

There's currently only one file/page in this folder. If this grows into a
real multi-page marketing site (`/pricing`, `/features`, `/about`, ...),
split `MarketingHome.tsx`'s sections (`Hero`, `Features`, `Pricing`, etc.)
into their own files here and give each its own route.

## Why `/welcome` and not `/`

`/` is already the authenticated Dashboard's index route, with its own
loader (`dashboardLoader`) that expects a logged-in session. Making `/`
conditionally show the marketing page for logged-out visitors and the
Dashboard for logged-in ones is a real, separate piece of work (checking
auth state before the router decides which to render) — deliberately not
done here to avoid touching that existing, working route. `/welcome` is a
plain, safe, additive route that doesn't change anything about how `/`
currently behaves.

If you do want this to become the actual homepage at `/` later, that's the
piece to build: a loader/guard on the root route that redirects an
authenticated visitor straight through to the Dashboard, and an
unauthenticated one to this page.

## Structure of `MarketingHome.tsx`

One file, a handful of small section components, rendered top to bottom:

- **`Nav`** — logo, "Log in" / "Get started free" links to `/auth` and `/auth/signup`.
- **`Hero`** — headline, sub-copy, the same two CTAs again.
- **`Features`** — a static `FEATURES` array (icon + title + description). Edit this array directly to add/change/remove a feature tile — no backend involved, this is pure marketing copy.
- **`Pricing`** — the one section that talks to the backend. See below.
- **`FinalCta`** — a second, lower-page nudge to sign up.
- **`Footer`** — logo, a few links, copyright line.

## Pricing — where the numbers actually come from

The pricing cards call `getPublicPlanCatalog()`
(`src/utils/api-request-functions.ts`), which hits `GET /api/v1/plans` on
the backend. That endpoint returns the **exact same catalog** the
in-app "Change Plan" page (`src/pages/settings/ChangePlanSettings.tsx`)
uses — built server-side from `PLAN_LIMITS` (what's actually enforced),
not a second copy of the numbers.

**Do not hardcode prices or feature lists into this page.** This app
already had a real bug once from a hand-maintained frontend copy of these
numbers drifting from what was actually enforced (see the comment on
`PLAN_CATALOG` in the backend's `utils/constant.ts`) — that's exactly the
mistake this section is built to avoid repeating. If pricing needs to
change, change it in the backend's `PLAN_CATALOG`/`PLAN_LIMITS`
(`time_sheet_server/src/utils/constant.ts`) and both this page and the
in-app plan page update together, automatically.

The backend route this calls (`GET /api/v1/plans` in `server.ts`) is
deliberately public — it's mounted *before* `authenticateUser`, separate
from the already-existing authenticated `GET /companies/plans` that the
in-app settings page still uses. It returns no company- or user-specific
data, just the same static catalog every visitor sees, so making it public
was safe.

## Styling

Uses the app's existing design tokens (`var(--primary)`, `bg-card`,
`border-border`, etc.) and the shared `Button` component — so it already
respects the visitor's light/dark theme preference the same way the rest
of the app does, with no extra setup needed.

## Known gaps / not done here

- No real screenshots or product imagery — text and icons only.
- No testimonials or customer logos — deliberately left out rather than
  filled with placeholder/fake content.
- Only one page. A real marketing site usually wants a dedicated
  `/pricing` page, a `/features` deep-dive, maybe a blog — none of that
  exists yet, this is a single-page landing page.
- `/` still always goes straight to the authenticated Dashboard/login
  flow — see "Why `/welcome` and not `/`" above.
