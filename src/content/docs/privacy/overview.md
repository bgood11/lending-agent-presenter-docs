---
title: Privacy overview
description: The personal data Lending Agent Presenter handles, the controller/processor split, the lawful basis, and the retention posture.
---

Lending Agent Presenter is a finance presentment surface. A retailer's sales rep keys a small set of personal data into the rep tablet, the customer reviews and acknowledges on their own phone, and the retailer's admin staff oversee the resulting audit trail. The personal data is narrow, the lawful basis is uncomplicated, and the retention is set by FCA recordkeeping rules rather than by anything the platform itself decides.

This section is written for retailers preparing to deploy Presenter, the data protection officer (DPO) function, and anyone reviewing the privacy posture as part of due diligence on the platform. It assumes a working knowledge of UK GDPR and the FCA's CONC and SYSC sourcebooks, and explains how the architecture of Presenter intersects with those.

## What personal data Presenter handles

The data inventory is short and stable. There are exactly seven fields that touch personal data on the customer-facing path.

| Field | Source | Purpose |
|---|---|---|
| Customer name | Rep types in `customer-capture.tsx` | Personalising the receipt and the audit log |
| Customer email | Rep types in `customer-capture.tsx` | Magic-link delivery |
| Customer mobile | Rep types in `customer-capture.tsx` | Magic-link delivery (SMS) |
| Goods description | Rep types in `quote-builder.tsx` | The "credit agreement" target on the receipt |
| Chosen finance option | Customer picks on phone | The acknowledgement subject |
| Acknowledgement booleans (4) | Customer ticks on phone | CONC 4.2 evidence |
| Free-text rep name | Rep types once into localStorage | Audit-trail attribution |

Two fields are derived: the IP and user-agent at each surface action are captured server-side and written to the audit log. They are diagnostic and evidential; they are not used for marketing or analytics.

What Presenter does not handle is at least as load-bearing as what it does. There is no date of birth, no address, no employment status, no income, no credit-search consent, no soft-search return, and no decision payload. Those fields are the lender's job, and the lender collects them from the customer after the customer confirms a Presenter receipt and is handed off to the lender's own application flow. The [data minimisation](data-minimisation/) page explains the design decisions that hold the dataset to seven fields.

## Controllers and processors

The controller/processor split for a Presenter deployment is conventional point-of-sale-finance shape.

- **The retailer is the data controller.** The retailer decides the purposes (presenting finance options to its own customers, collecting evidence of the customer's acknowledgement to satisfy CONC 4.2) and the essential means (which finance products are offered, which lenders sit on the panel, when and how customers are contacted). The retailer holds the FCA credit-broking permission and is the entity the customer can hold to account.
- **Lending Agent Presenter (the platform running on Vercel) is the data processor.** It executes the retailer's documented instructions (the per-skin catalogue, the four acknowledgement statements, the magic-link issuance and audit-log policies) and does not determine purposes of its own.
- **Vercel** is a sub-processor for hosting and edge delivery.
- **The email provider** (Postmark or SES) and **the SMS provider** (Twilio or MessageBird) are sub-processors for magic-link delivery.
- **The data store** (Vercel KV, or Postgres on Neon) is a sub-processor for quote and audit-log storage.
- **The lender** is a separate controller for everything that happens after the customer is handed off to the lender's own application flow. The hand-off is a controller-to-controller transition with its own lawful basis, not a sub-processor relationship.

The full per-deployment list and the contractual posture for each is in [sub-processors](sub-processors/).

For the demo deployment at `lending-agent-presenter.vercel.app` no real personal data is processed. The deployed instance uses fixture customer names (Sarah Mitchell, James Tate, Priya Shah) and fictional FCA register numbers. The privacy controls described in this section are the production-grade posture; the demo runs them through the same code paths but on synthetic data.

## Lawful basis

The lawful basis for processing customer name, email, mobile, and the chosen finance option is **Article 6(1)(b) of UK GDPR**: the processing is necessary for steps taken at the data subject's request prior to entering into a contract. The customer is at the retailer's premises (or completing an online enquiry) and has asked to see finance options for the goods they want to buy. The processing is precisely what is required to put a personalised receipt in their hands.

The lawful basis for the audit log is **Article 6(1)(c)**: compliance with a legal obligation to which the controller is subject. The retailer is bound by FCA SYSC 9.1.1R to take reasonable care to make and retain adequate records of its business activities and to retain those for the periods specified in SYSC 9.1.2R (broadly, three to five years for general records, longer for credit-broking activities falling under particular CONC and CCA provisions). The audit log is the artefact that satisfies that obligation for the customer's CONC 4.2 acknowledgement.

There is no marketing, no profiling, no automated decision-making, no special category data processed in the v1 surface. A planned post-v1 vulnerability indicator workflow would introduce special category data under Article 9; that is documented as a forward-looking item in [vulnerable customers](../regulatory/vulnerable-customers/) and is not in the v1 lawful-basis analysis.

## Retention

The retention posture is set by FCA recordkeeping rather than by privacy minimisation alone. Confirmed quotes and their associated audit events are retained for **seven years from `confirmedAt`**, aligned with the longer-tail SYSC 9 requirements that apply to consumer credit activity (see [retention](retention/) for the precise mapping). Unconfirmed quotes (where the magic-link expired without a customer confirmation) carry a much shorter cycle: customer email and mobile are purged 28 days after the link's `expiresAt`, and the residual quote shell (with PII removed) is kept for a year for operational analytics, then purged.

This split is deliberate. The seven-year cycle is what defends a retailer in an enforcement question. The 28-day cycle minimises the data held about customers who never returned a result, which is the largest single category by volume.

## What this section covers

The pages that follow take this overview apart in detail. Read [data flow](data-flow/) for where each field travels, [UK GDPR](uk-gdpr/) for the article-by-article mapping, [DPIA](dpia/) for the impact-assessment template a retailer should fill in for its first deployment, [data minimisation](data-minimisation/) for the design choices that keep the dataset small, [retention](retention/) for the purge schedule, [sub-processors](sub-processors/) for the per-deployment list, and [PECR and cookies](pecr-and-cookies/) for the messaging and storage controls on the customer surface.
