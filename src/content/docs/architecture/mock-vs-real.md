---
title: Mock vs real
description: Surface-by-surface diff between the demo and the production build.
---

The demo runs in the browser. Every server-side concern is mocked or stubbed. This page walks the seam between demo and production line by line so a future build can replace each piece independently.

## Top-level summary

| Layer | Demo | Production |
|---|---|---|
| Hosting | Vercel static + client-only routes | Vercel with Node runtime for API routes |
| State | Zustand `persist` to localStorage | Postgres (Neon or Vercel Postgres) + Vercel KV |
| Auth | None (rep-name in localStorage, no admin login) | Signed retailer URL, magic link for customer, Auth.js session for admin |
| Email | None | Postmark (preferred) or SES |
| SMS | None | MessageBird or Twilio (optional) |
| PDF | Styled HTML accordion | `@react-pdf/renderer`, stored on Vercel Blob |
| Audit log | Hardcoded fixtures in `lib/fixtures.ts` | `audit_events` table, append-only |
| Rate limiting | None | Vercel KV counters per resource |
| Observability | `console.log` | Vercel Analytics + structured logs to Logflare or Axiom |

## Marketing landing

| Concern | Demo | Production |
|---|---|---|
| Content | Static MDX/TSX in `app/page.tsx` and `components/marketing/` | Same. No backend interaction. |
| Embedded preview | Live React component at 0.7 scale | Same |
| Forms | None (the "Open the demo" CTA is a link) | Optional: a "request a demo" form posting to a CRM. Out of scope for v1. |

The marketing surface is real in both modes. The only delta is whether a "request a demo" form exists.

## Rep tablet

| Concern | Demo | Production |
|---|---|---|
| Bootstrap | Reads skin from URL, looks up `SKINS[skinId]` | `GET /api/retailer/me` from signed URL, returns `{retailer, brandKit, catalogue}` |
| Rep identity | Free-text name in localStorage | Same. Signed URL identifies the retailer; rep name is captured per device, not authenticated. |
| Form state | Zustand `inFlightQuote` | Same on the client. |
| Send to customer | `setInFlightQuote(...)` then route to `/demo/customer/[token]` | `POST /api/quote` returns 201, then redirect rep to a "sent" confirmation. Token is generated server-side. |
| In-store fallback | Same surface re-renders customer view inline | `POST /api/quote` with `inStoreFallback: true` returns the validated token; the rep tablet renders the customer view inline. |
| Rate limit | None | 10 quote-creates/min per signed retailer URL |

## Customer phone

| Concern | Demo | Production |
|---|---|---|
| Token validation | None (any string accepted) | HMAC-SHA256 + nonce blocklist + expiry check |
| Quote source | Reads `inFlightQuote` from Zustand | `GET /api/quote/by-token/{token}` returns the quote row |
| Catalogue source | `getCatalogue(skinId)` from `lib/catalogue.ts` | Same shape, joined on the server side, returned with the quote |
| Comparison maths | `lib/finance-math.ts`, in-browser | Same code, same module. Math runs client-side; the server stores raw inputs only. |
| Budget calculator | Pure client | Same |
| Acknowledgement submit | Local `setCustomerAck`, then route to `/demo/admin` | `POST /api/quote/{id}/acknowledge` with `AcknowledgementSchema` body. Server appends `option-picked` and `acknowledgements-confirmed` events, transitions status to `acknowledged`. |
| PDF preview | Styled HTML accordion in `components/customer/pdf-preview.tsx` | `@react-pdf/renderer` generates a PDF on `acknowledgements-confirmed`, uploads to Vercel Blob, stores the URL in the quote row. The customer sees a "download your quote" link. |
| Confirmation receipt | None | Email receipt to customer with PDF attached |
| Rate limit | None | 5 magic-link opens/min per token |

## Retailer admin

| Concern | Demo | Production |
|---|---|---|
| Auth | None | Auth.js with passwordless email or SSO |
| RBAC | None | `admin`, `auditor`, `read-only` (see [permissions and contracts](/implementation/brokers/permissions-contracts/)) |
| Dashboard data | `computeKpis(skinId)` over fixtures | `GET /api/admin/kpis` with date range, returns same shape |
| Quote list | `getQuotesForSkin(skinId)` | `GET /api/admin/quotes?status=&rep=&from=&to=&page=` |
| Quote detail | `getQuoteById(skinId, id)` | `GET /api/admin/quote/{id}` |
| Resend magic link | n/a | `POST /api/admin/quote/{id}/resend` (admin only) |
| CSV export | Static fixture download | Real query, streamed CSV |
| PDF download | Static placeholder | Signed URL to Vercel Blob |
| Rate limit | None | 30 admin reads/min per session |

## Walkthrough overlay

| Concern | Demo | Production |
|---|---|---|
| Coach marks | `lib/walkthrough.ts` step machine, rendered by `components/shell/walkthrough-overlay.tsx` | Removed. The walkthrough is a marketing-and-demo affordance, not a production feature. |
| Free-explore mode | Persona switcher, skin switcher, surface tabs | Removed |

The walkthrough is demo-only.

## Skin switcher

| Concern | Demo | Production |
|---|---|---|
| Switching | URL param + localStorage. All three skins live in the bundle. | Removed. Each retailer deploys with their own brand kit; no cross-retailer skin switcher. |

## What is identical between demo and production

A surprising amount.

- The four surfaces (marketing, rep, customer, admin) live at the same routes.
- The TypeScript types in `lib/skins.ts`, `lib/catalogue.ts`, `lib/finance-math.ts`, and `lib/state.ts` are unchanged.
- The finance maths in `lib/finance-math.ts` is reused verbatim. Same monthly payment, same target-payment binary search, same badge logic.
- The Tailwind tokens, the shadcn components, the Geist font, the motion transitions: all identical.
- The `AdminQuote` shape, the `AuditEvent` shape, the `QuoteStatus` enum: identical.

The boundary is narrow. It is concentrated at three points: token signing, persistence, and email delivery.
