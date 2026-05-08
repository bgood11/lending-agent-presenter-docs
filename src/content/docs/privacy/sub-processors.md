---
title: Sub-processors
description: Per-deployment sub-processor list with locations, contract types, and the data each receives.
---

A Presenter deployment relies on a small number of sub-processors, each engaged under written terms that flow down the controller's UK GDPR Article 28 obligations. This page lists them, what each receives, where they sit, and how the contractual posture is established. The list is the set the platform operator engages on behalf of the retailer-controller; the retailer authorises each sub-processor in writing as part of the data processing addendum (DPA) signed at deployment.

## Standing list

| Sub-processor | Function | Data received | Location | Contract |
|---|---|---|---|---|
| Vercel, Inc. | Application hosting, edge delivery, serverless function execution | Every server-side payload in transit | US-headquartered, EU/UK regions available (default `lhr1`) | Vercel DPA + UK IDTA addendum |
| Vercel KV (Upstash Redis under the hood) | Quote-state and rate-limit storage | Quote records, rate-limit counters | EU/UK region (configurable per deployment) | Vercel DPA covers; Upstash sub-processor flow-down |
| Neon (Postgres) | Quote and audit-log durable storage in Postgres deployments | Quote records, audit events | EU regions (Frankfurt, London) | Neon DPA + UK IDTA addendum |
| Postmark | Email delivery for magic-link receipts (one of two recommended email providers) | Customer name, customer email, magic-link URL, retailer skin name in message body | US-headquartered, EU region available | Postmark DPA + UK IDTA addendum |
| AWS Simple Email Service (SES) | Email delivery alternative to Postmark | Same as Postmark | EU regions (Ireland, Frankfurt, London) | AWS DPA + UK IDTA addendum |
| Twilio | SMS delivery for magic-link receipts (one of two recommended SMS providers) | Customer name, customer mobile, magic-link URL in message body | US-headquartered, regional carriers for delivery | Twilio DPA + UK IDTA addendum |
| MessageBird (Bird) | SMS delivery alternative to Twilio | Same as Twilio | NL-headquartered (EU) | MessageBird DPA |
| AWS S3 | Audit-log durable copy with object lock (compliance mode) | Daily JSONL roll-up of audit events | EU regions (London, Ireland) | AWS DPA + UK IDTA addendum |
| Upstash Redis | Rate-limit storage where used standalone (alternative to Vercel KV) | Rate-limit counters keyed on URL `kid`, magic-link token, admin session | EU region (configurable) | Upstash DPA |

The retailer chooses one email provider, one SMS provider, and one data-store backend at deployment time. The list above is the recommended set; the platform supports any of the listed alternatives without code change (configured via env vars).

## What each sub-processor sees

The data flow described in [data flow](data-flow/) determines what each sub-processor receives. Restated as a per-sub-processor inventory:

**Vercel** sees every payload in transit through the application's serverless functions. Vercel does not log request bodies by default; the platform's observability is at the request-path and response-code level.

**Vercel KV / Neon / Upstash** see the contents of the quote store and the audit log. This is the largest data exposure to any single sub-processor and is the reason the data-store choice is the most consequential for the retailer's risk register.

**The email provider** (Postmark or SES) sees the email body, which contains the customer's first name, the retailer's name, the goods description, and the magic-link URL. It does not see APRs, financial figures, or acknowledgement state. The provider's standard logs retain the message content for a provider-default window (Postmark 45 days for full content; SES configurable, default no body retention).

**The SMS provider** (Twilio or MessageBird) sees the SMS body with the same content as the email. Twilio's default retention for message bodies is 13 months; the deploy guidance enables the provider's redaction setting to drop bodies after 30 days. MessageBird's default is 30 days.

**S3** sees the daily JSONL roll-up of audit events, with all fields present. Object lock in compliance mode means the AWS account root cannot delete objects until retention expires.

## Contractual posture

For each sub-processor:

- A signed DPA between the platform operator and the sub-processor establishes the Article 28 obligations.
- The DPA includes the UK International Data Transfer Addendum (IDTA) where the sub-processor performs processing outside the UK.
- The DPA requires the sub-processor to engage its own sub-processors under flow-down terms.
- The DPA names the platform operator's notification channel for breaches (per UK GDPR Article 33 timing).

The retailer authorises the sub-processor list in writing as part of the deployment DPA. Adding or replacing a sub-processor requires a written notice to the retailer with at least 30 days for objection; the retailer's right to object and, if not resolved, to terminate the agreement is preserved.

## International transfers

The default deployment runs entirely within UK or EU regions. International transfers occur only where:

- A US-headquartered provider's logging tier (Vercel platform logs, Postmark customer support, Twilio operational data) processes metadata in a US region. This is covered by the UK IDTA addendum and, for EU-origin transfers, the EU-US Data Privacy Framework where the provider is certified.
- A retailer chooses a non-EU/UK region for cost or latency reasons. In that case the DPIA addresses the transfer specifically.

The platform does not transfer customer-facing data outside the UK or EU by default.

## Excluded providers

Several categories of provider that would commonly appear on a SaaS sub-processor list are deliberately absent:

- **No analytics provider.** No Google Analytics, Plausible, Segment, Mixpanel, Amplitude, Heap, Hotjar, Fullstory.
- **No tag manager.** No Google Tag Manager, no Tealium.
- **No marketing-automation provider.** No HubSpot, Marketo, Iterable, Customer.io.
- **No CDP.** No customer data platform.
- **No advertising network.** No Meta, Google Ads, LinkedIn Insight Tag.
- **No third-party customer-support widget on the customer surface.** A support widget on the marketing landing is permissible if the retailer wants one and is covered separately under PECR; the customer phone surface has none.
- **No model provider.** Presenter does not call any LLM API. There is no Anthropic, OpenAI, or equivalent in the sub-processor list, because there is no model in the system.

This last point is what most distinguishes the Presenter sub-processor list from the AI-mediated waterfall sibling product. The list is shorter and the data exposure is narrower for the same reason: the system has fewer moving parts.

## Per-deployment authorisation

The deployment DPA the retailer signs lists the specific sub-processor selection (one email provider, one SMS provider, one data-store backend, plus the standing platform sub-processors). The retailer's privacy notice references this list by URL or by appendix.

The platform operator publishes the sub-processor list and any changes at the deployment-instance URL (`/legal/sub-processors`) and notifies the retailer's named DPO contact directly.
