---
title: Data shapes
description: Authoritative TypeScript types for the demo state machine and the planned production API. Copied from lib/.
---

These types are the source of truth. The demo's Zustand store, the fixtures, and the planned API all conform to them. When the production backend lands it should consume these definitions verbatim.

## RetailerSkin

Defined in `lib/skins.ts`. One per retailer. Drives brand surface, FCA register footer, default scenario for the rep tablet, and the swatch in the skin switcher. The catalogue is keyed by `SkinId` separately (see `FinanceProduct` below).

```typescript
export type SkinId = "solaris" | "hayes" | "bright-lane";

export interface RetailerSkin {
  id: SkinId;
  name: string;
  shortName: string;
  vertical: string;
  tagline: string;
  fcaRegisterNumber: string;
  footerText: string;
  productLabel: string;
  defaultScenario: {
    description: string;
    price: number;
    depositPercent: number;
    customerName: string;
    customerEmail: string;
    customerMobile: string;
  };
  /** Display metadata for the skin switcher tile. */
  swatchHex: string;
}
```

A skin's lifecycle is static: it is loaded at module init time from `SKINS` and read by every surface. Adding a fourth skin requires a new entry in `SKINS`, a matching catalogue in `CATALOGUES`, and a logo SVG in `public/skins/`.

## FinanceProduct

Defined in `lib/catalogue.ts`. One per row in a retailer's contracted finance panel. Catalogues are per-skin; switching skin reloads the catalogue.

```typescript
export type FinanceProductType = "cash" | "ifc" | "monthly" | "bnpl";

export interface FinanceProduct {
  id: string;
  type: FinanceProductType;
  name: string;
  keyFeature: string;
  termMonths: number;
  /** APR as a decimal, e.g. 0.149 for 14.9%. 0 for cash and IFC. */
  apr: number;
  /** Lender display name for footer attribution. Null for cash. */
  lender: string | null;
  /** Deferred period in months for BNPL. Undefined for non-BNPL. */
  deferredMonths?: number;
  /** Minimum deposit required for this product, as a percent. */
  minDepositPercent?: number;
}
```

A product is read-only at runtime. In production it is loaded per retailer at onboarding from a database, and updated through a panel-management UI not present in v1.

## ComputedQuote

Defined in `lib/finance-math.ts`. Output of `computeQuote(product, price, depositPercent)`. Renders one finance product card on the rep tablet and one row in the customer comparison grid.

```typescript
export interface ComputedQuote {
  /** Cash deposit £ amount. */
  deposit: number;
  /** Amount of credit £, the principal financed. */
  amountOfCredit: number;
  /** Term in months. 0 for cash. */
  termMonths: number;
  /** Monthly payment £, 0 for cash. */
  monthlyPayment: number;
  /** Total amount payable £, including deposit. */
  totalPayable: number;
  /** Total interest £, 0 for cash and IFC. */
  totalInterest: number;
  /** Effective APR as a decimal. */
  apr: number;
  /** Deferred period in months, undefined for non-BNPL. */
  deferredMonths?: number;
}
```

`ComputedQuote` is derived state. It is recomputed on every input change. APR is treated as a nominal annual rate compounded monthly. UK regulated APR uses XIRR-style daily compounding under CONC App 1; the production build replaces `annuityMonthly` with the regulated calculation.

## InFlightQuote

Defined in `lib/state.ts`. The quote currently being built on the rep tablet, before it has been "sent" to the customer. Persisted only in-memory (Zustand `partialize` excludes it from localStorage).

```typescript
export interface InFlightQuote {
  description: string;
  price: number;
  depositPercent: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  /** Set when the rep selects "customer present, ack now". */
  inStoreFallback: boolean;
}
```

Lifecycle: created on rep tablet send, consumed on the customer phone surface, cleared when the customer confirms or the rep starts a new quote. In production it becomes the request body of `POST /quotes`.

## CustomerAcknowledgement

Defined in `lib/state.ts`. The customer's response to an in-flight quote. Built up across the customer phone surface as the customer picks an option, drags the budget slider, and ticks the four CONC 4.2 boxes.

```typescript
export interface CustomerAcknowledgement {
  pickedProductId: string | null;
  targetMonthly: number | null;
  acknowledgements: {
    minimumRepayment: boolean;
    canOverpay: boolean;
    contactLender: boolean;
    creditAgreement: boolean;
  };
  confirmedAt: string | null;
}
```

`confirmedAt` is the ISO timestamp set by the Confirm button. Until it is non-null, the quote sits in `option-picked` status. Once it is non-null, the quote is `acknowledged`. In production it becomes the request body of `POST /quotes/:id/acknowledge`.

## AdminQuote

Defined in `lib/fixtures.ts`. The shape returned by the planned `GET /admin/quotes` route. Carries the full audit trail.

```typescript
export interface AdminQuote {
  id: string;
  skinId: SkinId;
  /** ISO timestamp the quote was created. */
  createdAt: string;
  rep: string;
  customerName: string;
  customerEmail: string;
  description: string;
  price: number;
  depositPercent: number;
  status: QuoteStatus;
  /** ID from catalogue.ts of the option the customer picked. */
  pickedOptionId: string | null;
  /** Audit trail. */
  events: AuditEvent[];
}
```

`AdminQuote` is append-only after creation. Status transitions are driven by audit events landing on the timeline; the surface never edits the quote directly. The fixture generator in `lib/fixtures.ts` builds a deterministic 20-quote set per skin from a fixed seed so the dashboard is stable across reloads.

## AuditEvent

Defined in `lib/fixtures.ts`. One row in a quote's timeline. Multiple events per quote, ordered by `at`.

```typescript
export interface AuditEvent {
  /** ISO timestamp. */
  at: string;
  type:
    | "quote-created"
    | "quote-sent"
    | "magic-link-clicked"
    | "option-picked"
    | "acknowledgements-confirmed"
    | "quote-expired";
  by: "rep" | "customer" | "system";
  description: string;
  detail?: Record<string, string | number>;
}
```

Events are immutable. A quote's status is derived from the most recent event type. The timeline is the legal artefact for CONC 4.2 audit; see [Regulatory, Audit-as-evidence](/regulatory/audit-as-evidence/).

## QuoteStatus

```typescript
export type QuoteStatus =
  | "sent"
  | "opened"
  | "option-picked"
  | "acknowledged"
  | "expired";
```

Status transitions:

```mermaid
stateDiagram-v2
    [*] --> sent : quote-created + quote-sent
    sent --> opened : magic-link-clicked
    sent --> expired : 14 days elapsed
    opened --> option-picked : option-picked
    option-picked --> acknowledged : acknowledgements-confirmed
    acknowledged --> [*]
    expired --> [*]
```

Expiry is a system event. Magic links are valid for 14 days from `quote-sent`; this is a design default, configurable per retailer in production.

## Zod schemas (planned)

For the production API, every shape above is mirrored as a Zod schema for request/response validation. Schemas should be co-located with route handlers. Example for the in-flight quote:

```typescript
import { z } from "zod";

export const InFlightQuoteSchema = z.object({
  description: z.string().min(1).max(280),
  price: z.number().positive().max(1_000_000),
  depositPercent: z.number().min(0).max(95),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email().max(254),
  customerMobile: z.string().min(7).max(20),
  inStoreFallback: z.boolean(),
});

export const CustomerAcknowledgementSchema = z.object({
  pickedProductId: z.string().min(1),
  targetMonthly: z.number().positive().nullable(),
  acknowledgements: z.object({
    minimumRepayment: z.literal(true),
    canOverpay: z.literal(true),
    contactLender: z.literal(true),
    creditAgreement: z.literal(true),
  }),
});
```

The `acknowledgements` schema enforces all four flags being `true` at the schema layer; the API rejects partial acknowledgements at parse time rather than checking in the handler.
