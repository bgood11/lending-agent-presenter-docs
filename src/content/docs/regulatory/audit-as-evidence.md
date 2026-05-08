---
title: Audit as evidence
description: Why the audit log is enforcement-grade, with an illustrative defence under s.140A unfair-relationship and a mock investigation walkthrough.
---

The audit log is the artefact that survives the customer journey. Every claim a Presenter deployment makes about CONC 4.2 compliance, Consumer Duty outcomes, and customer acknowledgement rests on what the audit log can prove a year, three years, or seven years later. This page sets out why the log is enforcement-grade, and walks through the shape of a defence under section 140A of the Consumer Credit Act 1974 (unfair relationships) using the audit log as the primary evidence.

## What enforcement-grade means

An audit log that is enforcement-grade has four properties. The platform's log has each.

**Append-only at the storage layer.** The application role on the data store has `INSERT` only on the audit-event table; `UPDATE` and `DELETE` are revoked, and the table cannot be `TRUNCATE`d. A Vercel KV deployment uses an equivalent abstraction (write-once keys). A bug in the application code cannot retroactively edit the log; a malicious operator with application credentials cannot either. Detail in [tampering and replay](../safety/tampering-and-replay/).

**Off-platform durable copy.** Daily roll-up to AWS S3 with object lock in compliance mode and a 7-year retain-until date. Compliance mode means even the AWS account root cannot delete objects until the retention expires. The off-platform copy survives application bugs, accidental deletes, and platform-level data loss. The roll-up is what a regulator's information request is actually answered from.

**Verbatim text capture.** The four customer acknowledgement statements are recorded verbatim in the `quote.confirmed` audit event, not as version pointers. A future change to the regulatory wording or the UI copy does not corrupt historical records. Each historical record is self-contained and replayable without recourse to a UI codebase that may have moved on.

**Hash-chained payload integrity.** Each `quote.created` audit event records a SHA-256 hash of the canonical quote payload as issued. Each `quote.confirmed` event re-computes the hash from the rendered view and records that. The two hashes match if the customer saw the issued quote unchanged. A divergence is evidence of tampering and is detectable at replay time.

## The audit-event schema

Every event is a small JSON document with a fixed shape. The fields that matter for evidence:

- `eventId`: UUID v4, server-assigned. Globally unique.
- `ts`: ISO-8601 with millisecond resolution, server clock.
- `type`: one of the enumerated event types (`quote.created`, `quote.sent`, `quote.opened`, `quote.option-picked`, `quote.acknowledged`, `quote.confirmed`, `quote.expired`, `quote.failed-to-send`, `admin.read`).
- `quoteId`: foreign key to the quote record.
- `retailerId`: tenant identifier.
- `actor`: structured record of who or what generated the event (`rep`, `customer`, `system`, `admin`), with the rep name (where applicable), the admin session ID (where applicable), and any other identifying information.
- `ip`: IP address, full IPv4/IPv6.
- `ua`: user-agent, truncated to 256 characters.
- `payload`: event-specific. For `quote.created`, the full quote shape and the SHA-256 hash. For `quote.confirmed`, the picked `productId`, the four acknowledgement booleans, the verbatim text strings, the SHA-256 hash, and the token's `kid` and `nonce`.

Detail on the hash computation, the canonicalisation, and the event-by-event field list is in [tampering and replay](../safety/tampering-and-replay/).

## A defence under s.140A unfair-relationship

Section 140A of the Consumer Credit Act 1974 gives the courts power to determine that the relationship between a debtor and a creditor arising out of a credit agreement (or a related agreement) is unfair, and to make orders altering the agreement, requiring repayment, or extinguishing rights. The unfair-relationship test is broad and post-hoc; courts have considered the firm's conduct at point of sale years after the agreement was made.

A typical s.140A claim relevant to a Presenter deployment alleges that the customer was not given an adequate explanation of the credit agreement at point of sale, or that a particular feature of the agreement (a high APR, a deferred-payment trap, a commission structure) operated unfairly. The retailer's defence requires reconstruction of the pre-contract conversation: what was on screen, what was said, what was acknowledged.

### What the audit log gives the defence

For a defended s.140A claim, the platform produces the following from the audit log for the relevant `quoteId`:

- The `quote.created` event: the full quote payload as issued, the catalogue version rendered, the rep name, the time of creation.
- The `quote.sent` event: the time of magic-link issuance and the channel (email, SMS, in-store fallback).
- The `quote.opened` events: every time the customer (or someone with the link) opened the magic-link URL, with timestamps and IP/user-agent.
- The `quote.option-picked` events: the customer's option-pick history, including any changes of mind before the final pick.
- The `quote.confirmed` event: the picked `productId`, the four verbatim acknowledgement statements, the four boolean flags (all true for a confirmed agreement), the SHA-256 hash, and the IP/user-agent of the device on which the confirmation was made.

From these, the defence reconstructs the customer's view: the option-comparison grid as the customer saw it, the figures rendered, the acknowledgement statements as they were worded at the time, and the timing of each interaction.

### Reconstructing the view

The reconstruction works because the catalogue is version-controlled and the audit log records the catalogue version. A specific `quoteId` is rendered by:

1. Loading the `quote.created` payload (price, deposit, customer name, goods description).
2. Loading the catalogue version recorded in the event.
3. Running `lib/finance-math.ts` against the inputs to compute the figures the customer saw.
4. Loading the per-skin disclosure block as it stood at the time (the disclosure block is part of the catalogue version).
5. Verifying the resulting payload's SHA-256 hash matches the hash recorded in the event.

If the hashes match, the reconstruction is faithful and the defence has the customer's view as it actually was. If the hashes diverge, the reconstruction is unsound and the defence must explain the divergence (a deliberate post-hoc edit to the live record, for example, which the append-only audit-event record nonetheless preserves).

### What the customer is shown to have acknowledged

The four verbatim statements in the `quote.confirmed` event are the customer's acknowledgement. The defence presents them as they were ticked:

- "I understand I must make the minimum repayment each month."
- "I understand I can make overpayments at any time, which could reduce my interest."
- "If I want to overpay, I understand I should contact the lender directly to apply it correctly."
- "I understand the option I've picked is a regulated credit agreement, subject to status."

Each statement is tied to a CONC 4.2.5R(2) sub-rule (see [CONC 4.2](conc-4-2/) for the mapping). The defence shows that each of the (2) matters was the subject of an explicit, individually-ticked acknowledgement, made on the customer's own device, after a period during which the customer had the opportunity to read the receipt at their own pace.

### What the audit log cannot prove

The audit log cannot prove what the rep said in conversation at point of sale. It can prove what was on screen, who issued the magic link, and what the customer ticked. The retailer's rep-training records, supervisory programme, and any contemporaneous notes are the supporting evidence for the in-person element. Consumer Duty's emphasis on outcomes-monitoring (the KPI dashboard's acknowledgement rate, time-to-confirm distribution, abandonment rate) provides the population-level signal that complements the per-quote audit-log evidence.

The platform does not claim to prove an unfair-relationship case is unmeritorious. It claims to give the retailer the facts: what the customer was shown, what they ticked, and when. The retailer's solicitors and the court make the unfair-relationship determination; the audit log gives them an unimpeachable factual record to argue from.

## A mock investigation walkthrough

Imagine the FCA, three years post-acknowledgement, asks the retailer about a particular quote. The retailer's compliance officer takes the `quoteId` and:

1. Pulls the audit-event sequence for that `quoteId` from the live store. If the live store has rolled the records, pulls them from the S3 archive (compliance-mode object lock means the archive cannot have lost them).
2. Verifies the chain: every event's `ts` is monotonic with respect to the previous event's, every payload hash matches its computed value.
3. Reconstructs the customer's view (as above) and produces a screenshot-grade rendering of the customer phone surface as it stood at the time.
4. Renders the four verbatim acknowledgement statements alongside the customer's tick state.
5. Produces the response document for the FCA: a covering letter, the reconstructed view, the audit-event sequence, and the verifying hashes.

The response is auditable, reproducible, and grounded in records that the retailer cannot have edited after the fact.

## What this section does not cover

The mechanics of the hashing, the token format, and the storage controls are covered in [tampering and replay](../safety/tampering-and-replay/) in the safety section. The retention horizon and the off-platform mirror configuration are covered in [retention](../privacy/retention/) in the privacy section. This page is about the use of the resulting record in defence and supervision; the cross-references give the engineering substrate.
