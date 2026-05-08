---
title: Data minimisation
description: The seven personal-data fields the platform handles, what is deliberately excluded, and the design decisions that hold the dataset to that scope.
---

UK GDPR Article 5(1)(c) requires that personal data be "adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed". Lending Agent Presenter holds the customer dataset to seven fields. This page explains what each field is for, what is deliberately excluded, and the architectural choices that make the exclusions stick.

## What is in scope

Seven fields constitute the customer dataset. Two more (IP and user-agent at each surface action) are diagnostic and evidential but not customer-supplied.

| Field | Purpose | Why this and not less |
|---|---|---|
| Customer name | Receipt personalisation; magic-link recipient identification | A receipt without the customer's name is harder to match in a wrong-recipient scenario. Removing it weakens accuracy. |
| Customer email | Magic-link delivery channel | The magic link is the customer's route to the receipt. The retailer can elect SMS-only and drop email, in which case this field is omitted. |
| Customer mobile | Magic-link delivery channel; production option for SMS-OTP-on-confirm | The retailer can elect email-only and drop mobile. Default is both. |
| Goods description | Identifying what the credit agreement is for | Required for the receipt and for the audit log to be meaningful. |
| Chosen finance option | The acknowledgement subject | Required for the audit log to record what was acknowledged. |
| Acknowledgement booleans (4) | CONC 4.2 evidence | Required by the regulation. |
| Rep name (free-text) | Audit-log attribution | Required for the retailer to investigate later questions about a particular quote. |

The four acknowledgement statements themselves are not personal data; they are static strings rendered verbatim from `components/customer/acknowledgement-checklist.tsx` and copied into the audit event at the moment of confirmation.

## What is deliberately excluded

The largest data-minimisation decisions are about what is not collected. Each exclusion is a deliberate scoping choice rather than an oversight.

**No date of birth.** Date of birth is required for credit-search eligibility and for hard-underwriting decisions. The lender collects it. Presenter does not, because Presenter is not a broker-side underwriting tool; it is a presentment surface. A customer who confirms a Presenter receipt is then handed off to the lender's own application flow, where the lender collects DOB along with the rest of the underwriting dataset.

**No address or address history.** Same reasoning. Address is the lender's input to credit-bureau search. Presenter does not perform a credit search and does not need it.

**No employment status, income, or outgoings.** These are creditworthiness fields under CONC 5.2A. They are the lender's responsibility to collect and assess. Presenter does not gate quotes on creditworthiness; it presents every contracted option in the catalogue, leaving creditworthiness assessment to the lender post-handoff. This is the architecturally clean line between presentment and broker-side underwriting.

**No credit-search consent and no soft-search return.** Same reasoning. Credit-search consent is a lender-controlled artefact under CONC 2.7 and is captured by the lender at the start of its application flow.

**No marketing-consent fields.** Presenter has no marketing function. There is no email-marketing toggle, no "Yes, send me offers" checkbox, no preference centre. A retailer that wants to send marketing email to confirmed customers handles that in its own CRM, with its own lawful basis (typically PECR-soft-opt-in or fresh consent), and Presenter does not feed that flow.

**No analytics events.** No Google Analytics, Plausible, Segment, Mixpanel, Amplitude, Heap, Hotjar, Fullstory, or any equivalent. The customer phone surface emits zero telemetry events. The marketing landing page (covered separately in [PECR and cookies](pecr-and-cookies/)) is the only surface that may carry analytics, and only with the retailer's affirmative consent banner.

**No third-party tag manager.** No Google Tag Manager, no Tealium. The pages render server-side; client-side scripts are limited to the application JavaScript that ships with Next.js.

## Magic-link tokens never include PII

The magic-link token is opaque. Its payload is `{v, kid, quoteId, expiry, nonce}`. None of those fields are personal data; `quoteId` is a UUID v4 that is unguessable and not derivable from any customer-identifying input. A leaked token discloses one quote (and only after server-side fetch following HMAC verification), not a customer's name or contact details.

This is a deliberate departure from the easier pattern of including the customer's email or name in the URL. The easier pattern leaks PII into URL bars, browser history, server access logs, and any HTTP-level proxy on the path. The opaque-token pattern keeps PII inside the server boundary at the cost of one extra database read on link-open, which is negligible.

## Email and SMS bodies are scoped to non-financial content

The magic-link delivery message contains: the customer's first name, the retailer's name, the goods description, and the magic-link URL. It does not contain APRs, monthly figures, deposit, total payable, or term length. A wrong-recipient mistake therefore exposes the customer's name and the goods description, not their financial situation.

This is a small choice with a measurable privacy benefit. The customer must open the magic link to see the financial figures, and only the legitimate recipient is likely to do that.

## Audit log carries the smallest evidential payload

Each audit event holds the smallest set of fields that would still constitute defensible evidence. The four acknowledgement booleans are recorded with their verbatim text strings, the chosen `productId`, and a SHA-256 hash of the quote payload as rendered. The full quote payload itself is in the quote record, not duplicated into the audit event. The audit event therefore tells you what was acknowledged about which quote without redundantly storing the quote contents.

The IP and user-agent are recorded for forensic value (they help reconstruct the customer's path if there is later a dispute) but are not used for any other purpose. The IP is held in full; the user-agent is truncated to 256 characters.

## What design decisions hold the line

A few architectural choices keep the dataset minimal even as future features land.

- **Server-side rendering of the customer surface.** The page does not need a client-side data layer that could accumulate fields out of band.
- **Zod schemas at the API boundary.** Quote-create, quote-confirm, and admin-read endpoints reject any field not in the schema. A future developer cannot accidentally widen the dataset by adding a property to a request body.
- **Per-skin catalogue isolation.** The finance product catalogue is per-skin in `lib/catalogue.ts`. There is no global product table that grows with retailers; adding a retailer adds a skin definition, not a column to a customer table.
- **No "while you are here" surface.** There is no field on the customer phone that asks for anything beyond the option pick and the four acknowledgements. Adding such a field would require a code change, a schema change, and a privacy-notice update; the cost of expansion is built in.

## A note on the rep name capture

The rep name is captured as a free-text string in the rep tablet's localStorage. It is not authenticated and is not validated. This is a deliberate trade-off: requiring real rep authentication would push the platform toward a per-rep-credentials model that carries its own privacy and operational overhead, and the FCA-compliant evidential value is in the audit log's combination of (claimed rep name, IP, user-agent, timestamp, retailer URL `kid`), not in the rep-name field alone.

A retailer that wants stronger rep accountability deploys the platform behind its own rep-side SSO and the audit log captures the SSO subject ID instead. The implementation/for-retailers section covers that pattern.
