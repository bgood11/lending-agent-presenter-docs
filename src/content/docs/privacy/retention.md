---
title: Retention
description: Field-by-field retention schedule, the SYSC 9 anchoring, and the 28-day purge for unconfirmed PII.
---

Retention in Lending Agent Presenter is set by FCA recordkeeping rather than by privacy minimisation alone. Two distinct cycles apply: a long cycle for confirmed quotes and their audit events (seven years, anchored to FCA SYSC 9), and a short cycle for unconfirmed quotes (28 days for PII, one year for the residual non-PII shell). This page sets out the per-field schedule, the trigger conditions, and the operational mechanics.

## Why seven years

FCA SYSC 9.1.1R requires firms to take reasonable care to make and retain adequate records of their business activities. SYSC 9.1.2R sets default minimum retention periods, with longer horizons for specific regulated activities. For consumer-credit-broking activities, the practical retention horizon is informed by:

- The Limitation Act 1980 default of six years for contract claims, plus a margin to cover the date the cause of action accrued versus the date the customer becomes aware of it.
- Section 140A of the Consumer Credit Act 1974 (unfair-relationship claims), which has been litigated up to 11 years post-event in commission-disclosure case law and where the FCA has signalled redress horizons of comparable length.
- The FCA's general expectation that broker firms retain pre-contract evidence for the lifetime of the regulated agreement plus a tail.

Seven years sits inside this band and is the de facto industry standard for credit-broking pre-contract evidence. The retailer can configure a longer retention if its own risk appetite calls for it; the platform supports that with a per-tenant retention setting.

## Per-field schedule

| Field | Retention | Trigger | Purge action |
|---|---|---|---|
| Quote record (confirmed): customer name, email, mobile, goods, chosen option, ack booleans | 7 years | `confirmedAt + 7y` | Hard delete from store; audit-log copy preserved |
| Quote record (unconfirmed): customer name, email, mobile | 28 days after `expiresAt` | Magic-link expires without confirmation | Hard delete email and mobile; goods description retained |
| Quote record (unconfirmed): goods, price, chosen-option-if-picked | 1 year after `expiresAt` | Operational analytics retention | Hard delete |
| Audit event: `quote.created` | 7 years | `created.ts + 7y` | Hard delete |
| Audit event: `quote.sent` (with full email/mobile) | 28 days after `expiresAt` if quote unconfirmed; otherwise 7 years | Same-window cascade | Redact PII fields (last 4 digits of mobile retained); event remains |
| Audit event: `quote.opened`, `quote.option-picked` | 7 years if confirmed; 28 days after `expiresAt` if not | Cascade with quote | Hard delete or redact |
| Audit event: `quote.confirmed` (verbatim ack text, productId, payload hash) | 7 years | `confirmedAt + 7y` | Hard delete |
| Audit event: `admin.read` | 2 years | Admin-side oversight horizon | Hard delete |
| Audit event: `quote.expired`, `quote.failed-to-send` | 1 year | Operational | Hard delete |
| IP and user-agent on any audit event | Same as parent event | Cascade | Cascade |
| Rep-name string in localStorage | Per-device, until rep clicks "End of day" | Rep action | Cleared |
| S3 audit-log roll-up (compliance-mode object lock) | 7 years | Object-lock retention | Object lock auto-expires; AWS retains for 30d in case of legal hold |

## The 28-day cycle for unconfirmed quotes

The largest single category of records, by volume, is unconfirmed quotes. A magic-link expires without the customer confirming for any number of reasons: they forgot, they decided against the purchase, they completed the purchase elsewhere, they thought about it longer than the link's lifetime allowed.

Holding their full contact details for seven years would be excessive. The 28-day cycle:

1. At `expiresAt + 28 days`, a daily cron job identifies quote records with no `confirmedAt`.
2. The job redacts `customerEmail`, `customerMobile`, and `customerName` from the quote record and from the related `quote.created` and `quote.sent` audit events. Last 4 digits of the mobile are retained on the audit event for fraud-investigation continuity.
3. The job preserves the residual quote shell (goods, price, deposit, retailer skin, rep name, status `expired`) for one year, for operational analytics and platform observability.
4. At `expiresAt + 1 year`, a second cron job hard-deletes the residual shell.

This minimises PII exposure for customers who never returned a result, while preserving enough operational data for the retailer to investigate platform-level questions (how many expired without confirmation per skin per week, which is a useful product-design signal).

## Subject erasure requests

UK GDPR Article 17 (right to erasure) is constrained by Article 17(3)(b) where processing is necessary for compliance with a legal obligation. The seven-year cycle for confirmed records sits inside that exemption.

The retailer's response to an erasure request distinguishes:

- **Operational records** (rep-tablet localStorage, email-provider message-body retention, SMS-provider message-body retention): erased on request within 30 days.
- **Audit-log records of confirmed quotes**: retained under the SYSC 9 exemption. The response cites the regulation and explains the trade-off.
- **Audit-log records of unconfirmed quotes**: PII redacted within 30 days of request (or the 28-day automatic cycle, whichever is sooner).

The admin portal in production exposes an erasure-request workflow that produces a DPO-reviewable artefact: which records will be erased now, which will be retained under the exemption, and the response template for the data subject.

## Subject access requests

The admin portal's subject-access export takes a customer email or mobile and produces a JSON bundle of:

- Every quote record where that email or mobile appears (current PII state, whether redacted or full).
- Every audit event keyed to those quotes.
- A human-readable PDF summary of the same.

The export is rate-limited (one per identifier per day) to prevent abuse. The audit log records the export itself.

## Off-platform durable copy

The audit-log roll-up to S3 with object lock (compliance mode, 7 years) is the durable evidence that survives application bugs, accidental deletes, and platform-level data loss. The roll-up runs daily, ships JSONL files keyed by `(retailerId, date)` to a per-tenant bucket prefix, and writes with the `Object Lock Mode = COMPLIANCE` and `Retain Until Date = ts + 7y` headers. Compliance mode means even the AWS account root cannot delete the object until the retention expires.

Because the roll-up writes objects with a 7-year compliance lock, a deliberate erasure of a confirmed-quote record (for example, in response to a regulator-led purge) requires waiting out the lock or invoking AWS legal-hold processes. This is a deliberate trade-off in favour of evidence integrity.

## Operational notes

The cron jobs run at 03:15 UTC daily on Vercel Cron. Failure of a job is alerted to the platform operator and is documented as a P2 incident; the next run picks up missed records, so a one-day failure is tolerable.

The retention configuration is held per-tenant in `lib/retention-config.ts`. The defaults above match the recommended posture; a retailer can extend the seven-year horizon (a longer cycle is always permissible if SYSC 9 supports it) but cannot shorten it below five years without a documented exception, because shortening it would risk failing the recordkeeping obligation.
