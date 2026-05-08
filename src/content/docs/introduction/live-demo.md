---
title: Live demo
description: What the live demo shows, what's mocked, and how to switch between scripted and free-explore modes.
---

The live demo is at [lending-agent-presenter.vercel.app](https://lending-agent-presenter.vercel.app). It runs the four surfaces and the three retailer skins end-to-end with no backend.

## What the demo shows

- The marketing landing with an embedded interactive preview of the rep tablet.
- The rep tablet: live finance product cards, deposit slider, send-to-customer handoff.
- The customer phone: comparison grid, target-monthly budget calculator, key-feature acknowledgement checklist, confirm.
- The retailer admin: KPI tiles, sparkline of quotes per day, filterable list, per-quote detail with audit timeline.
- The skin switcher: live brand, logo, FCA register number, and catalogue swap across all four surfaces.

## What is mocked

- No backend. Quote state lives in a Zustand store. Acknowledgement events do not persist beyond the browser session.
- No magic link signing. The customer URL is a static `demo-token` route.
- No email or SMS. The "Send to customer" button crossfades to the customer surface in the same browser.
- No PDF generation. The PDF preview is a styled HTML mock of the SECCI and pre-contract pack.
- No real audit storage. The admin portal reads from the seeded fixtures in `lib/fixtures.ts` (twenty quotes per skin, deterministic by seed).
- No authentication. Rep name is a localStorage string captured on first load.

The shape of every fixture matches what the planned API will return, so the surfaces wire onto a real backend without surface rewrites. See [Reference, API routes (planned)](/reference/api-routes/) for the route table and Zod schemas.

## Scripted vs free-explore

The demo lands in **scripted mode** by default. A coach-mark overlay walks the visitor through six steps:

1. Welcome on the marketing landing.
2. Build a quote on the rep tablet.
3. Send to customer.
4. The customer's view (try the budget calculator).
5. Pick, acknowledge, confirm.
6. What the retailer sees (open a quote to see the audit timeline).

A "Skip walkthrough" link top-right exits to **free-explore mode**. Free-explore exposes a persona switcher (rep, customer, admin) and the three-skin switcher in the top corner. URL state syncs so a free-explore link can be shared. A "Restart walkthrough" link in the footer brings scripted mode back at any time.

Mode and walkthrough step are not persisted across sessions; every fresh visit lands in scripted mode. Skin and rep name are persisted to localStorage.

## Sharing the demo

Direct deep links work. Examples:

- `https://lending-agent-presenter.vercel.app/demo/rep?skin=hayes` opens the rep tablet on the Hayes & Sons skin.
- `https://lending-agent-presenter.vercel.app/demo/admin?skin=bright-lane` opens the Bright Lane Dental admin dashboard.

Skin selection is read from `?skin=` and falls back to localStorage and then to the Solaris default.
