---
title: Glossary
description: Defined terms used across the docs. Regulatory acronyms, product mechanics, and product-specific vocabulary.
---

## APR

Annual Percentage Rate. The total cost of credit expressed as a yearly rate, including interest and any compulsory charges. UK regulated APR uses XIRR-style daily compounding under FCA CONC App 1. The demo simplifies to monthly compounding (`apr / 12`) for readability.

## Audit timeline

The append-only sequence of `AuditEvent` records on a quote. Drives the admin detail page and the legal artefact for CONC 4.2 evidence. Events: `quote-created`, `quote-sent`, `magic-link-clicked`, `option-picked`, `acknowledgements-confirmed`, `quote-expired`.

## BNPL

Buy Now Pay Later. A finance product where the customer defers payments for a set period (the deferred period) and then pays the balance over the remaining term. Some BNPL terms waive interest if the balance is settled in full before the deferred window ends.

## Catalogue

The per-skin set of `FinanceProduct` entries the retailer can present to a customer. Defined in `lib/catalogue.ts` and keyed by `SkinId`.

## CONC 4.2

The FCA Consumer Credit sourcebook chapter on adequate explanations. Requires firms to give borrowers an adequate explanation of the principal features of the credit agreement before they sign. The four customer acknowledgements in this product map onto CONC 4.2.

## Consumer Duty

The FCA's outcomes-based standard requiring firms to deliver good outcomes for retail customers. Cross-cuts CONC, the Principles, and the SMCR. See [Regulatory, Consumer Duty](/regulatory/consumer-duty/).

## Customer phone surface

The magic-link receipt page at `/demo/customer/[token]`. Where the customer compares options, runs the budget calculator, and confirms the four CONC 4.2 acknowledgements.

## Deferred period

For BNPL products, the months at the start of the term during which no payments are required. Stored as `FinanceProduct.deferredMonths`.

## ECOF

Every Contracted Option Fronted. The principle that every finance option in a retailer's catalogue should be visible to the customer side-by-side, with the customer (not the rep) picking. The product hypothesis in one acronym.

## FCA

Financial Conduct Authority. The UK financial services regulator. Authorises and supervises consumer credit firms.

## FRN

Firm Reference Number. The FCA Register identifier for an authorised firm. Six digits in the demo skins (812374, 624901, 738256). Rendered in the footer.

## IFC

Interest Free Credit. A regulated credit product at 0% APR. The customer pays the same total whether they pay in full upfront or spread over the IFC term.

## In-flight quote

The quote currently being built on the rep tablet, before send. Held in `useDemoStore.inFlightQuote`. Not persisted to localStorage.

## In-store fallback

The rep-side acknowledgement path. When the customer has no phone available, the rep clicks "Customer present, ack now" and hands the tablet over for the four-acknowledgement step. The audit event records `in_store_fallback=true`.

## Magic link

A signed URL delivered to the customer by email and SMS. Resolves to a single quote via an HMAC-SHA256 token over `(quoteId, expiry, nonce)`. 14-day expiry by default.

## Menu-style presentment

Showing every contracted finance option side-by-side on a single page, rather than walking the customer through a sequential wizard. Contrast with the waterfall sibling, where lenders are tried one at a time.

## Nominal monthly rate

The simplifying assumption used by `lib/finance-math.ts`: monthly rate = APR / 12. Production replaces this with the regulated XIRR calculation.

## PDF preview

A styled HTML mock of the SECCI and pre-contract pack. Not a real PDF in v1. Production would use `@react-pdf/renderer` or a Puppeteer-on-Vercel pipeline.

## Pre-contract information

Required disclosures the customer must receive before signing a regulated credit agreement. SECCI is the standardised form for most consumer credit. Delivered as the PDF preview at the customer phone surface.

## QuoteStatus

The five-state lifecycle of a quote: `sent`, `opened`, `option-picked`, `acknowledged`, `expired`. Derived from the most recent `AuditEvent` type.

## Rep tablet surface

The rep-facing quote builder at `/demo/rep`. One-page, two-pane: inputs left, live finance product cards right.

## Retailer admin surface

The audit-only portal at `/demo/admin`. Dashboard, list, detail. Read-only by design.

## SECCI

Standard European Consumer Credit Information. The standardised pre-contract disclosure form for most UK consumer credit. Delivered to the customer in the PDF preview.

## Signed retailer URL

The HMAC-signed URL the rep opens to load the rep tablet. Carries `retailerId` and is rotated by `kid`. Replaces per-rep authentication.

## Skin

A retailer's brand layer. Defines colour, logo, FCA register number, footer text, default scenario, and the finance catalogue. Three skins ship in v1: Solaris, Hayes & Sons, Bright Lane.

## SMCR

Senior Managers and Certification Regime. The FCA framework for individual accountability in financial services firms. Relevant to the retailer and broker, not the SaaS provider.

## Target-monthly slider

The customer-side budget calculator. As the customer drags it, options re-sort and unreachable ones disable. Powered by `depositForTargetMonthly` in `lib/finance-math.ts`.

## Trust gradient

The principle that customer-facing acknowledgements should sit on the customer's own device whenever possible, with the rep's tablet as the in-store fallback. Reduces the chance of a rep ticking the boxes on the customer's behalf.

## Waterfall sibling

[Lending Agent](https://lending-agent.vercel.app), the AI-mediated agentic credit broking demo. Same brand family, opposite journey shape: lenders contacted sequentially rather than presented in parallel.
