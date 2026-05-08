---
title: Audit and evidence integration
description: Wiring the audit log into the broker's CRM, generating SAR/DSAR responses, and 7-year retention per SYSC 9.
---

The audit log is the product. Every quote produces a sequence of events; the events are append-only; the sequence is replayable. This page specifies the shapes, the integration patterns, and the retention rules.

## Audit event shape

```typescript
interface AuditEvent {
  /** ISO timestamp. */
  at: string;
  type:
    | "quote-created"
    | "quote-sent"
    | "magic-link-clicked"
    | "option-picked"
    | "acknowledgements-confirmed"
    | "quote-expired"
    | "quote-revised"      // production only
    | "vulnerability-flagged"; // production only, see vulnerability process
  by: "rep" | "customer" | "system";
  description: string;
  detail?: Record<string, string | number>;
}
```

Each event carries `quoteId` (parent), an immutable timestamp, who triggered it (rep, customer, system), a human-readable description, and an optional detail bag for structured fields.

## Event taxonomy

| Type | Trigger | `by` | Detail typically includes |
|---|---|---|---|
| `quote-created` | Rep clicks Send on the rep tablet | `rep` | `repName`, `price`, `depositPercent` |
| `quote-sent` | Magic-link email or SMS sent | `system` | `channel` (email / sms), `to` (hashed), `tokenKid` |
| `magic-link-clicked` | First valid token validation | `customer` | `userAgent`, `ipPrefix` (first three octets only) |
| `option-picked` | Customer taps an option on the comparison grid | `customer` | `productId`, `productName` |
| `acknowledgements-confirmed` | Customer ticks all four boxes and clicks Confirm | `customer` | `pickedProductId`, `targetMonthly` |
| `quote-expired` | TTL elapsed without acknowledgement | `system` | `reason: "ttl"` |
| `quote-revised` | Admin or rep revises a sent quote | `rep` | `before`, `after` (selected fields only) |
| `vulnerability-flagged` | Rep or admin flags the quote for vulnerability review | `rep` | `signal` enum, `notes` |

The taxonomy is closed; new types require a schema migration. Existing rows are not mutated when the schema changes.

## Webhook integration

The recommended integration. Each appended event fires a webhook to the broker's CRM.

```http
POST <broker_webhook_url>
Content-Type: application/json
X-LAP-Signature: t=<unix>, v1=<HMAC-SHA256 of body>
X-LAP-Event: audit-event

{
  "id": "evt_01JBYXAH8K9PZ4MR3W4FDVMN6Q",
  "quoteId": "quo_01JBYX9XR3CQX6EKAJ5R4PVQ7N",
  "retailerId": "ret_solaris_uk",
  "type": "acknowledgements-confirmed",
  "at": "2026-05-08T14:32:01.122Z",
  "by": "customer",
  "description": "Customer confirmed all four key-feature acknowledgements (CONC 4.2)",
  "detail": {
    "pickedProductId": "solaris-monthly-60",
    "targetMonthly": 220
  }
}
```

The signature scheme matches GitHub's pattern: HMAC-SHA256 over the timestamp plus body, secret rotates via `kid`. The CRM verifies signature, deduplicates by `id`, and ignores out-of-order or duplicate events.

Webhook delivery is at-least-once. Events are idempotent on `id`; the CRM should write upsert.

Failed deliveries retry with exponential backoff: 1s, 5s, 30s, 5m, 30m, 2h, then dead-letter. Dead-letter events are visible in the admin portal's "delivery health" panel and replayable.

## Batched export (fallback)

For brokers without webhook ingest:

| Mode | Cadence | Format |
|---|---|---|
| Nightly CSV | Daily 02:00 UTC | One row per event, one file per retailer |
| Manual export | On demand from admin portal | Same shape, filtered by date range |

Columns: `event_id`, `quote_id`, `retailer_id`, `at_utc`, `type`, `by`, `description`, plus flattened `detail.*` columns for the most common fields (`product_id`, `target_monthly`, `picked_product_id`, `signal`, `channel`).

## CRM mapping

A typical broker CRM (Salesforce, HubSpot, custom) wants:

| CRM concept | Lending Agent Presenter source |
|---|---|
| Lead created | `quote-created` event |
| Lead engaged | `magic-link-clicked` event |
| Opportunity stage: "quote acknowledged" | `acknowledgements-confirmed` event |
| Audit trail attachment | Generated PDF, link in Vercel Blob |
| Vulnerability flag | `vulnerability-flagged` event triggers a CRM workflow |

Brokers using Salesforce can integrate via inbound webhook → Apex flow. HubSpot users can use a custom code action in workflows. Custom CRMs receive the JSON directly.

## SAR and DSAR responses

A subject access request (SAR/DSAR) under UK GDPR Article 15 needs every piece of data Lending Agent Presenter holds about the customer, exported in a machine-readable format and delivered within one calendar month.

The admin portal has a `/admin/dsar` page (planned, not in v1 demo) that takes a customer email or quote ID and outputs:

- All `quotes` rows where `customerEmail` matches.
- All `audit_events` for those quotes.
- Generated PDFs (download links to Vercel Blob).
- A signed JSON export per customer.

The export is delivered as a zip file. The broker is responsible for sending it to the customer; Lending Agent Presenter is the data source.

### Erasure (Article 17)

Erasure requests are partial. Personal data fields (`customerName`, `customerEmail`, `customerMobile`, IP-prefix in events) are nulled or hashed. The audit-event records remain (with the personal data fields removed) because the regulatory retention obligation under SYSC 9 supersedes Article 17 for FCA records.

This is the lawful basis exemption Article 17(3)(b): retention is required for compliance with a legal obligation.

## Retention

| Record type | Retention | Rule |
|---|---|---|
| `quotes` rows (acknowledged) | 7 years from `confirmedAt` | SYSC 9 / FCA general record-keeping |
| `quotes` rows (expired or never acknowledged) | 24 months from `createdAt` | Operational; UK GDPR data minimisation principle |
| `audit_events` for acknowledged quotes | 7 years from `confirmedAt` | SYSC 9 |
| `audit_events` for expired quotes | 24 months from `createdAt` | UK GDPR |
| Generated PDFs | 7 years (acknowledged) / 24 months (other) | Same as parent quote |
| Personal data fields after erasure | Hashed/nulled, retained as metadata | Article 17(3)(b) |
| Webhook delivery records | 90 days | Operational |
| Magic-link nonces (KV) | Token TTL only | Replay protection |
| Admin session records | 30 days | Operational |

A nightly retention sweep purges rows where retention has elapsed. The sweep is logged; deletion events are themselves auditable for two years.

## Replay safety

Because the audit log is append-only and event-shaped, the broker can replay a customer's journey end-to-end at any point in the retention window. This is the SYSC 9 evidence story: not "we stored the final PDF" but "we can show, in order, what was presented and what was acknowledged".
