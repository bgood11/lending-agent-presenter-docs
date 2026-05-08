---
title: Skin definition format
description: How to define a new retailer skin. The fields, the colour-token override, the FCA register number, the catalogue shape, and where the logo SVG lives.
---

A retailer skin is three file edits and one asset. Adding a fourth skin called "Northwind Conservatories" takes about ten minutes once the brand assets are in hand.

## What a skin owns

| Concern | File | Field or asset |
|---|---|---|
| Identity, FCA, defaults | `lib/skins.ts` | `RetailerSkin` entry in `SKINS` |
| Finance catalogue | `lib/catalogue.ts` | `FinanceProduct[]` entry in `CATALOGUES` |
| Brand colour | `app/globals.css` | `[data-skin="..."] { --brand-primary: ... }` rule |
| Brand logo | `public/skins/` | `{skinId}.svg` |

## Step 1, add a SkinId

In `lib/skins.ts`, extend the union type and the `isValidSkinId` and `ALL_SKIN_IDS` helpers:

```typescript
export type SkinId = "solaris" | "hayes" | "bright-lane" | "northwind";

export const ALL_SKIN_IDS: SkinId[] = [
  "solaris", "hayes", "bright-lane", "northwind",
];

export function isValidSkinId(id: string): id is SkinId {
  return id === "solaris"
    || id === "hayes"
    || id === "bright-lane"
    || id === "northwind";
}
```

## Step 2, add the RetailerSkin entry

Same file, extend `SKINS`:

```typescript
export const SKINS: Record<SkinId, RetailerSkin> = {
  // ...existing entries
  northwind: {
    id: "northwind",
    name: "Northwind Conservatories",
    shortName: "Northwind",
    vertical: "Conservatories and orangeries",
    tagline: "Made-to-measure conservatories. Finance to suit the build.",
    fcaRegisterNumber: "904712",
    footerText:
      "Northwind Conservatories Ltd is a credit broker, not a lender. Finance is offered by a small panel of FCA-authorised lenders. Northwind Conservatories Ltd is authorised and regulated by the Financial Conduct Authority, FRN 904712.",
    productLabel: "Conservatory build",
    defaultScenario: {
      description: "Edwardian conservatory, 4m × 3.5m, tiled roof",
      price: 22000,
      depositPercent: 20,
      customerName: "Robert Carling",
      customerEmail: "robert.carling@example.com",
      customerMobile: "+44 7700 900512",
    },
    swatchHex: "#1d4ed8",
  },
};
```

Field-by-field:

- `id`: must match the `SkinId` literal.
- `name`: full legal trading name. Used in the footer and the customer phone header.
- `shortName`: the marketing-friendly name. Used in nav, KPI titles, switcher tile.
- `vertical`: one-line vertical descriptor. Used on the marketing audience cards.
- `tagline`: single sentence. Used in the marketing hero per-skin.
- `fcaRegisterNumber`: FCA Register FRN. Six digits. Renders in the footer alongside `footerText`.
- `footerText`: full compliance statement. Should follow the FCA-recommended phrasing for a credit broker. Audited by the broker compliance team.
- `productLabel`: the noun the rep tablet uses for "what is being financed", e.g. "Treatment plan", "Fitted kitchen project". Drives microcopy on the description input.
- `defaultScenario`: pre-fills the rep tablet on first load and on skin switch. Customer name and email must be plausible non-real values.
- `swatchHex`: colour swatch shown in the skin switcher tile. Match the skin's `--brand-primary` for visual consistency.

## Step 3, add the catalogue

In `lib/catalogue.ts`, extend `CATALOGUES`:

```typescript
export const CATALOGUES: Record<SkinId, FinanceProduct[]> = {
  // ...existing entries
  northwind: [
    {
      id: "northwind-cash",
      type: "cash",
      name: "Pay in full",
      keyFeature: "Pay in full now or on completion. No credit agreement.",
      termMonths: 0,
      apr: 0,
      lender: null,
    },
    {
      id: "northwind-ifc-12",
      type: "ifc",
      name: "12 months interest free",
      keyFeature: "0% APR. Pay the same total whether you pay now or spread.",
      termMonths: 12,
      apr: 0,
      lender: "Hitachi Personal Finance",
    },
    {
      id: "northwind-monthly-60",
      type: "monthly",
      name: "60 months @ 9.9% APR",
      keyFeature: "Fixed monthly payments over the agreed term.",
      termMonths: 60,
      apr: 0.099,
      lender: "V12 Retail Finance",
    },
  ],
};
```

Per-product field rules:

- `id`: globally unique, prefixed with the skin id.
- `type`: `cash`, `ifc`, `monthly`, or `bnpl`. Drives card layout and finance maths.
- `name`: short label. Convention is "{term} months @ {apr} APR" for monthly, "{term} months interest free" for IFC.
- `keyFeature`: one-liner shown on the rep tablet card. Should describe how repayment behaves, not market the option.
- `termMonths`: 0 for cash. For BNPL, the total term including the deferred period.
- `apr`: decimal, e.g. `0.099` for 9.9%. 0 for cash and IFC.
- `lender`: display name for footer attribution. Null for cash.
- `deferredMonths`: required for `bnpl`, undefined otherwise.
- `minDepositPercent`: optional. Some lenders require a floor (e.g. 10% on long-term BNPL).

## Step 4, add the brand colour

In `app/globals.css`, add a `data-skin` rule for the new skin. The skin switcher writes `data-skin="..."` onto `<body>` and the rule cascades.

```css
[data-skin="northwind"] {
  --brand-primary: #1d4ed8;
}
```

`--brand-primary` is the only token that varies per skin. The amber accent, slate scale, typography, and motion language stay constant.

## Step 5, drop in the logo

Save the logo as `public/skins/northwind.svg`. Conventions:

- Single-colour or two-colour SVG. Use `currentColor` in fills so the icon picks up text colour where appropriate.
- Square viewport, e.g. `viewBox="0 0 32 32"`.
- 24 px to 40 px display sizes; design at the smaller end and scale up.
- No raster embeds. Vectors only.

`components/shell/skin-logo.tsx` reads from `public/skins/{skinId}.svg` automatically; no code change needed.

## What does not need to change

- The state machine. The Zustand store is skin-agnostic.
- The fixtures. `lib/fixtures.ts` already loops over `ALL_SKIN_IDS` to build the admin demo set.
- The walkthrough. Steps reference surfaces, not skins.
- The marketing copy. Sections like "How it works" are skin-agnostic; only the footer and per-skin scenarios switch.

## Verification checklist

- [ ] Skin appears in the switcher with the correct swatch colour.
- [ ] Rep tablet pre-fills with the new `defaultScenario` on switch.
- [ ] Customer phone header shows the new logo and brand name.
- [ ] Admin dashboard shows non-zero KPIs (the fixture seed produces 20 quotes).
- [ ] Footer renders the new FCA register number and `footerText`.
- [ ] `?skin=northwind` deep link works on every surface.
- [ ] Light and dark mode both render the logo legibly.
