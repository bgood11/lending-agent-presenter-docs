---
title: Catalogue onboarding
description: The form Shermin needs from the retailer, the FinanceProduct shape, BNPL specifics, and rate-change procedure.
---

The catalogue is the source of truth for the rep tablet. Every product the rep can offer must be in it; every product in it gets rendered, every quote, every customer. This page specifies what Shermin needs from the retailer to populate it.

## What Shermin needs

A single completed catalogue intake form per retailer, with one row per finance product. Each row carries:

| Field | Type | Notes |
|---|---|---|
| Display name | Short text | E.g. "60 months @ 8.9% APR". User-facing. |
| Product type | `cash` / `ifc` / `monthly` / `bnpl` | Drives the maths. |
| Term in months | Integer | 0 for cash. 12-240 typical for credit. |
| APR | Decimal, e.g. `0.089` | 0 for cash and IFC. |
| Lender display name | Text | For footer attribution. Null for cash. |
| Deferred period in months | Integer, optional | BNPL only. 3, 4, 6, 12 typical. |
| Minimum deposit | Percent, optional | Default 0. Lender floors apply. |
| Key feature one-liner | Short text | Optional override; defaults provided per product type. |

The retailer signs off each row. Shermin typesets the rows into `finance_products` and runs a verification quote against the rep tablet's preview.

## Product shape

The TypeScript type is canonical. From `lib/catalogue.ts`:

```typescript
export type FinanceProductType = "cash" | "ifc" | "monthly" | "bnpl";

export interface FinanceProduct {
  id: string;
  type: FinanceProductType;
  name: string;
  keyFeature: string;
  termMonths: number;
  apr: number;
  lender: string | null;
  deferredMonths?: number;
  minDepositPercent?: number;
}
```

`id` is auto-generated as `<retailerSlug>-<typeSlug>-<term>` with a disambiguator for variants (e.g. `solaris-bnpl-96-4` and `solaris-bnpl-96-6`).

## A worked catalogue

The Solaris demo catalogue covers the four product types and is a good shape reference:

| Product | Type | Term | APR | Lender | Deferred | Notes |
|---|---|---|---|---|---|---|
| Pay in full | cash | 0 | 0 | n/a | n/a | Always present. |
| 12 months interest free | ifc | 12 | 0% | Novuna Personal Finance | n/a | |
| 24 months interest free | ifc | 24 | 0% | Novuna Personal Finance | n/a | |
| 36 months interest free | ifc | 36 | 0% | Novuna Personal Finance | n/a | |
| 60 months @ 8.9% APR | monthly | 60 | 8.9% | V12 Retail Finance | n/a | |
| 96 months, 4 month deferred | bnpl | 96 | 14.9% | V12 Retail Finance | 4 | |
| 96 months, 6 month deferred | bnpl | 96 | 14.9% | V12 Retail Finance | 6 | |

Cash is always present. Most retailers run three to seven credit products plus cash. The rep tablet renders all of them side-by-side regardless of count; UX scales gracefully up to about ten cards.

## BNPL deferred-payment specifics

BNPL needs careful handling because the customer disclosure has more moving parts.

```typescript
{
  id: "solaris-bnpl-96-4",
  type: "bnpl",
  name: "96 months @ 14.9% APR, 4 month deferred",
  termMonths: 96,
  apr: 0.149,
  lender: "V12 Retail Finance",
  deferredMonths: 4,
}
```

The maths in `lib/finance-math.ts`:

- `paymentTermMonths = termMonths - deferredMonths` for BNPL.
- The monthly payment is amortised over `paymentTermMonths`, not `termMonths`.
- Total payable includes interest accrued during the deferred window.
- The customer can settle in full before `deferredMonths` ends to pay no interest. The acknowledgement checklist surfaces this; the lender's contract enforces it.

The rep tablet card for a BNPL product shows: deposit, monthly (post-deferral), total payable, term, deferred period. The customer phone surface shows the same plus a one-line key feature: "Settle in full before the deferred period ends to pay no interest."

Catalogue intake must specify, per BNPL product, whether the deferred-payment period:

- Charges interest from day 1 (settlement before end caps interest).
- Charges interest only from end of deferred period.

The default is the first form. If a lender ships the second form, the key feature one-liner is overridden to match the lender's contract wording.

## Rate changes

Rates change. Lender APR updates, IFC promotions roll on and off, BNPL terms get retired. The procedure:

1. Retailer notifies Shermin in writing (email is fine, attachment optional).
2. Shermin updates the affected `finance_products` rows. Existing rows are not edited in place; the row is marked `retired`, a new row is inserted with the updated APR and a new `id`.
3. The new row is live for any quote built after the change. Quotes built before the change retain their original product reference; their PDFs and audit trails show the rate at the time of issue.
4. The retailer is notified by email when the change is live.

```typescript
interface FinanceProductRow extends FinanceProduct {
  effectiveFrom: string;
  retiredAt: string | null;
  /** ID of the row that supersedes this one, if any. */
  supersededBy: string | null;
}
```

A retired row is not displayed on the rep tablet. Quotes referencing a retired row by `id` continue to display correctly because the row is preserved.

## Validation

Shermin runs three checks before a catalogue goes live:

1. **Round-trip a sample quote** through `computeQuote` for every product against a known-good reference (the Excel sheet the lender provided). Tolerance: ±£0.50 monthly, ±£5 total payable.
2. **Render the rep tablet** in staging with the new catalogue. Eyeball every card. Confirm key features read correctly and badge highlights are sensible.
3. **Confirm the lender attribution** on the customer phone PDF preview.

After sign-off, the catalogue becomes live for that retailer.
