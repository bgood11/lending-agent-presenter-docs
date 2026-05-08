---
title: PECR and cookies
description: Cookie posture across the four surfaces, the reason there is no analytics or marketing tracking in v1, and PECR-specific obligations on magic-link delivery.
---

The Privacy and Electronic Communications Regulations 2003 (PECR) sit alongside UK GDPR and govern cookies and similar storage technologies, electronic marketing, and a few related areas. PECR's rule 6 (the "cookie rule") requires consent for any storage of, or access to, information on a user's device, except where the storage is "strictly necessary" for a service the user has expressly requested. Lending Agent Presenter is built around that exception. The customer-facing surfaces use no analytics, no marketing, and no third-party tracking.

This page sets out the cookie posture per surface, the PECR considerations on the magic-link delivery channel, and the marketing landing page's separate analytics decision.

## Customer phone (`/demo/customer/<token>`)

This is the surface where PECR matters most. A customer arrives via a magic link, picks an option, and confirms.

**Cookies set:** none. The page is server-rendered. The customer's interaction with the option-pick, budget calculator, and acknowledgement checkboxes runs in client-side React state that lives in memory for the page lifetime. Nothing is written to `document.cookie` or `localStorage`.

**Storage accessed:** none. The page does not read any pre-existing cookie or localStorage value. There is no cross-page persistence on the customer surface; closing the tab loses no state, because the state is server-side, keyed on the magic-link token.

**Why this matters under PECR.** Without any storage written or accessed, PECR rule 6 is not engaged. There is no cookie banner, because there is nothing to consent to. The customer's first interaction with the surface is the surface itself.

**Magic-link tokens are URL-bound, not cookie-bound.** The token lives in the path (`/demo/customer/<token>`). It is not copied into a cookie. This is a deliberate choice that keeps the customer surface free of cookies entirely.

## Rep tablet (`/demo/rep`)

The rep tablet is used by retailer staff, not customers. Some local persistence is present.

**Cookies set:** none.

**localStorage written:** the rep name string and the demo-state Zustand snapshot (skin, walkthrough step). These are strictly necessary to make the surface usable; the rep should not have to retype their name every time the tablet is woken.

**PECR position.** PECR's strictly-necessary exemption applies. Rep-name capture is the service the rep has requested by using the tablet to issue quotes; storing it locally is necessary to that service. The tablet's "End of day" link clears localStorage and tab.

**Note.** The rep tablet is a retailer-staff surface, not a customer surface. The relevant data-protection regime is the retailer's employment privacy notice, not the customer-facing privacy notice.

## Retailer admin portal (`/demo/admin/*`)

The admin portal in production sits behind retailer SSO.

**Cookies set:** the SSO session cookie (HttpOnly, Secure, SameSite=Lax, set by the SSO IdP), and the application's own session cookie (HttpOnly, Secure, SameSite=Strict).

**localStorage written:** none.

**PECR position.** Both cookies are strictly necessary for the authenticated session the admin user has requested by signing in. PECR rule 6's exemption applies.

**Demo deployment.** The demo at `lending-agent-presenter.vercel.app` opens the admin portal without authentication for portfolio walkthrough purposes; this is documented as a demo-mode banner on every admin page. The demo sets only a small Zustand-state cookie/localStorage entry to remember the active skin and demo mode; this is functional and falls under the strictly-necessary exemption.

## Marketing landing (`/`)

The marketing landing page is the only surface where analytics could plausibly be valuable. The v1 demo deployment carries no analytics. A retailer deploying its own production instance and wanting to measure marketing-page traffic must implement a PECR-compliant consent banner first.

**v1 demo posture.**

- No Google Analytics, no Plausible, no any analytics.
- No marketing pixels.
- No tag manager.
- No third-party fonts that set cookies (fonts ship via `next/font`, served from the application's own origin).
- No customer-support widget.
- No social-share widgets that load third-party scripts.

**If a retailer wants analytics in production.** The retailer adds a CMP (consent management platform) that satisfies PECR rule 6: cookies are blocked by default, set only on opt-in, with a clear refuse-all option. The implementation/for-retailers section provides guidance on CMPs that integrate cleanly (Cookiebot, OneTrust, the open-source Klaro). Adding a CMP is the retailer's decision, not the platform's default.

## PECR considerations on magic-link delivery

PECR governs electronic marketing and certain transactional messaging. A magic-link receipt is transactional, not marketing, and falls outside the marketing-consent rules in PECR regulations 22 and 23. The customer is in an active commercial relationship with the retailer (they are at the retailer's premises or have made an enquiry), and the magic link is a direct response to that interaction.

The retailer should still respect the customer's stated channel preference. If the customer at point of sale has indicated they prefer email over SMS or vice versa, the rep's tablet allows the rep to omit the unselected channel and the magic link is sent only via the requested route.

Marketing follow-up to a confirmed customer ("we noticed you looked at our finance options, here's a follow-up offer") is a separate processing activity with its own PECR compliance work. Presenter does not perform this follow-up. A retailer that wants to do so handles it in its own CRM, with its own lawful basis (typically PECR's soft opt-in or fresh consent), and Presenter does not feed that flow.

## Cookie inventory summary

| Surface | Cookies | localStorage | Strictly necessary | Consent required |
|---|---|---|---|---|
| Marketing landing | None in v1 | None in v1 | n/a | n/a (no storage) |
| Rep tablet | None | Rep name, demo state | Yes | No (PECR exemption) |
| Customer phone | None | None | n/a | n/a (no storage) |
| Admin portal (production) | SSO session, app session | None | Yes | No (PECR exemption) |
| Admin portal (demo) | Demo-state functional cookie | Demo state | Yes | No (PECR exemption) |

The inventory reflects the v1 deployment. Any future addition (analytics, marketing, third-party widgets) requires a privacy review and, where applicable, a CMP. The default posture is to ship with the inventory above.
