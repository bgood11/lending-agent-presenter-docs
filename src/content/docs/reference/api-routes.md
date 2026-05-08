---
title: API routes (planned)
description: Production API surface. Method, path, body, response, auth, and rate-limit ceiling per route. PLANNED, not implemented in v1 demo.
---

> **PLANNED, not implemented in v1 demo.** Every route below is a target shape for the production build. The v1 demo runs entirely client-side over Zustand and hardcoded fixtures. The shapes below match the data shapes in [Reference, Data shapes](/reference/data-shapes/) so the demo surfaces wire onto a real backend without rewrites.

## Authentication model

Three auth contexts:

- **Signed retailer URL**. The rep tablet is opened from a URL signed with the retailer's HMAC key (`kid`-rotated, base64url, see [Architecture, Magic-link mechanics](/architecture/magic-link-mechanics/)). The URL carries `retailerId`. No per-rep auth.
- **Magic link token**. The customer opens `/quotes/:id` with a `token=` query string. The token is HMAC-SHA256 over `(quoteId, expiry, nonce)`. Tokens are single-quote, expire after 14 days, and can be invalidated server-side.
- **Retailer SSO session**. The admin portal sits behind retailer SSO. Roles: `admin`, `auditor`, `read-only`. RBAC matrix in [Implementation, For retailers, Adoption path](/implementation/retailers/adoption-path/).

## Route table

| Method | Path | Body schema | Response schema | Auth | Rate limit |
|---|---|---|---|---|---|
| POST | `/quotes` | `InFlightQuoteSchema` | `{ quoteId, magicLinkUrl }` | Signed retailer URL | 10 / min per signed URL |
| GET | `/quotes/:id` | none | `QuoteResponseSchema` | Magic link token | 30 / min per token |
| POST | `/quotes/:id/acknowledge` | `CustomerAcknowledgementSchema` | `{ confirmedAt }` | Magic link token | 5 / min per token |
| GET | `/admin/quotes` | none, query params for filters | `AdminQuote[]` | Retailer SSO (any role) | 60 / min per session |
| GET | `/admin/quotes/:id` | none | `AdminQuote` | Retailer SSO (any role) | 60 / min per session |
| POST | `/admin/csv-export` | `{ filters }` | text/csv stream | Retailer SSO (admin or auditor) | 5 / min per session |

## POST /quotes

Creates a quote and issues a magic link. Called by the rep tablet on **Send to customer's phone**.

```typescript
// Request
{
  description: string;
  price: number;
  depositPercent: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  inStoreFallback: boolean;
}

// Response 201
{
  quoteId: string;
  magicLinkUrl: string;
  expiresAt: string; // ISO
}
```

Side effects: persist quote, emit `quote-created` and `quote-sent` audit events, dispatch email and SMS via the configured providers. If `inStoreFallback === true`, skip email and SMS dispatch but still issue a `magicLinkUrl` for the rep to navigate to on their tablet.

Rate limit: 10 / min per signed retailer URL. A retailer typically issues one signed URL per tablet; reasonable showroom throughput is well under this ceiling.

## GET /quotes/:id

Resolves a magic link token to the customer-facing quote payload.

```typescript
// Response 200
{
  quoteId: string;
  retailer: { name, shortName, fcaRegisterNumber, footerText, logoUrl };
  rep: { name };
  inFlight: InFlightQuote;
  computed: Array<{ product: FinanceProduct; quote: ComputedQuote; }>;
  expiresAt: string;
}
```

Returns `403` on token mismatch, `410` on expired token, `404` on missing quote. The customer-facing payload deliberately excludes audit events and internal IDs.

Rate limit: 30 / min per token. Generous to allow the customer to refresh, drag the budget slider, expand and collapse the PDF preview, etc.

## POST /quotes/:id/acknowledge

Captures the customer's option pick and the four CONC 4.2 acknowledgements. Called on **Confirm**.

```typescript
// Request
{
  pickedProductId: string;
  targetMonthly: number | null;
  acknowledgements: {
    minimumRepayment: true;
    canOverpay: true;
    contactLender: true;
    creditAgreement: true;
  };
}

// Response 200
{
  confirmedAt: string; // ISO timestamp set server-side
}
```

The four acknowledgement booleans are typed as `z.literal(true)` to enforce all-four at schema parse. `pickedProductId` must match a product in the quote's catalogue or the call returns `422`.

Side effects: emit `option-picked` and `acknowledgements-confirmed` audit events, set quote status to `acknowledged`.

Rate limit: 5 / min per token. Stops accidental double-submits and abuse without throttling normal use.

## GET /admin/quotes

Lists quotes for the retailer behind the SSO session. Query params for filters.

```
GET /admin/quotes?rep=&status=&dateFrom=&dateTo=&minValue=&maxValue=&limit=50&cursor=
```

Response is a cursor-paginated `AdminQuote[]`. Default page size 50, max 200. Filter values map onto the same fields the v1 demo's list view exposes.

Rate limit: 60 / min per session. Comfortable for a manual auditor; a CSV export of the same filter set should use `POST /admin/csv-export` rather than walking the cursor.

## GET /admin/quotes/:id

Returns a single `AdminQuote` with its full audit timeline. Used by the detail page.

Rate limit: 60 / min per session.

## POST /admin/csv-export

Streams a CSV of quotes matching the filter set. Same filter fields as `GET /admin/quotes`. Streamed to keep memory bounded; a 12-month export of a busy retailer can exceed 100k rows.

```typescript
// Request
{
  filters: {
    rep?: string;
    status?: QuoteStatus | QuoteStatus[];
    dateFrom?: string;
    dateTo?: string;
    minValue?: number;
    maxValue?: number;
  };
}
```

Response: `text/csv` with header row matching `AdminQuote` columns plus expanded `events`. Auth requires `admin` or `auditor` role; `read-only` is rejected with `403`.

Rate limit: 5 / min per session. Heavier than the read routes; CSV generation hits the database harder.

## Error handling

Standard error envelope:

```typescript
{
  error: {
    code: string;        // machine-readable, e.g. "TOKEN_EXPIRED"
    message: string;     // human-readable
    requestId: string;   // for support correlation
  };
}
```

Common codes: `TOKEN_EXPIRED` (410), `TOKEN_INVALID` (403), `QUOTE_NOT_FOUND` (404), `VALIDATION_FAILED` (422), `RATE_LIMITED` (429), `INTERNAL` (500). The customer phone surface renders user-facing copy keyed off `code`, not `message`.

## Versioning

The route table above is `/v1`. Breaking changes go to `/v2`. Additive fields (new optional response keys) ship without a version bump. Mark deprecated routes with a `Deprecation` header per RFC 8594 and a 6-month sunset window.
