---
title: Branding and white-label
description: Per-retailer skin definition, CSS variable override, logo SVG requirements, footer text format.
---

Each retailer is a skin. A skin is a small set of brand inputs that override the default visual layer: a primary colour, a logo, footer text, and an FCA register number. Amber stays as the secondary accent across all skins so the family resemblance to Lending Agent is preserved.

## Skin definition

```typescript
interface RetailerSkin {
  id: SkinId;
  name: string;
  shortName: string;
  vertical: string;
  tagline: string;
  fcaRegisterNumber: string;
  footerText: string;
  productLabel: string;
  defaultScenario: { /* demo only */ };
  swatchHex: string;
}
```

In production, the active skin is loaded from `retailers` and `brand_kits` on every request. Rep, customer, and admin surfaces all read from the same skin, so a brand change cascades immediately.

## Brand primary colour

Each skin overrides one CSS variable, `--brand-primary`, on `<body>`. The skin switcher writes a `data-skin` attribute; `globals.css` selects on that attribute and sets the variable.

```css
:root {
  --brand-primary: #f59e0b; /* default amber */
}

body[data-skin="solaris"] {
  --brand-primary: #047857; /* Solaris green */
}

body[data-skin="hayes"] {
  --brand-primary: #92400e; /* Hayes warm-brown */
}

body[data-skin="bright-lane"] {
  --brand-primary: #0369a1; /* Bright Lane teal-blue */
}
```

Amber (`#f59e0b`) remains the secondary accent. Components reach for `--brand-primary` for the primary CTA, the active skin tile, and the customer phone "your option" highlight. Amber is used for badges, highlights, and the rep tablet's "best for" cues.

Brand primary should:

- Pass WCAG 2.1 AA contrast against white (`#ffffff`) for solid-on-white usage. Target 4.5:1 for body-text-sized strokes.
- Pass AA against the dark surface (`#0f172a`) for dark-mode readability.
- Not collide with semantic colours (red for errors, amber for highlights, green for confirmation).

Verify with the contrast strip baked into the demo at `/demo/admin` (developer tool, not customer-visible).

## Logo SVG requirements

Logo is rendered inline. Paths use `currentColor` so the same SVG works on light and dark backgrounds without recolouring.

| Requirement | Reason |
|---|---|
| Single SVG file, inline-friendly | Avoid raster image flicker and CDN dependencies |
| `fill="currentColor"` and/or `stroke="currentColor"` | Recolours to context; works on both light and dark |
| Single tone | Brand primary is set by the colour token, not the SVG |
| Clean `viewBox` (no transforms baked in) | Scales predictably; avoids distortion |
| ≤ 4KB after SVGO | Fast to ship in JSON and inline in HTML |
| Square or 2:1 wide aspect ratio | Renders at 32px and 96px slots cleanly |
| No embedded raster (`<image>`), no fonts (`<text>`) | Reduces failure surface on mobile browsers |

A logo with two-tone artwork should be flattened to a single tone. If the retailer insists on two-tone, supply two logos and an explicit dark-mode override; surface support for two-tone is out of scope for v1.

Test rendering at three sizes: 24px (admin sidebar), 32px (rep tablet header), 96px (customer phone receipt header). All three should look correct at 1x and 2x device pixel ratios.

## Footer text

Every surface footer carries a fixed disclosure. The format:

```
<Retailer legal name> is a credit broker, not a lender.
Finance options are provided by a small panel of FCA-authorised lenders.
<Retailer legal name> is authorised and regulated by the Financial Conduct Authority,
FRN <fcaRegisterNumber>.
```

Wording is a strict template. Retailer compliance signs off the exact string. Variations:

- If the retailer is itself a lender, replace the first line with the appropriate disclosure ("[Name] is a lender. Subject to status and affordability.").
- If the panel is sole-lender, replace "a small panel" with "an FCA-authorised lender".

The FCA register number is stored as a 6- or 7-digit string. It is rendered prefixed by `FRN`.

```typescript
{
  fcaRegisterNumber: "812374",
  footerText:
    "Solaris Home Energy is a credit broker, not a lender. We work with " +
    "a small panel of FCA-authorised lenders to find finance options for " +
    "your home energy installation. Solaris Home Energy is authorised and " +
    "regulated by the Financial Conduct Authority, FRN 812374.",
}
```

## FCA register number footer placement

The footer is the only place the FCA register number appears. It is rendered on:

- The marketing landing footer for the retailer's standalone branded marketing site (if any). Not applicable for the multi-tenant demo.
- The rep tablet footer (small, persistent at the bottom of the surface).
- The customer phone receipt page (as part of the standard footer).
- The customer phone PDF (in the masthead of the generated PDF).
- The admin portal footer.

The number is not displayed inline in copy or in the audit timeline. CONC 3.5 requires it to be present and legible; the footer treatment satisfies that without crowding the surface.

## Brand kit row

```typescript
interface BrandKit {
  retailerId: string;
  brandPrimaryHex: string;
  logoSvg: string;
  productLabel: string;
}
```

`productLabel` is the noun the rep tablet shows for the goods being priced. "Solar installation", "Fitted kitchen project", "Treatment plan". Keeps the surface speaking the retailer's language.

## Skin authoring checklist

For a new retailer:

1. Brand primary hex picked, contrast verified against white and dark surfaces.
2. Logo SVG supplied, validated by the seven requirements above, smoke-tested at 24/32/96px.
3. Footer text drafted, signed off by retailer compliance.
4. FCA register number confirmed against the public FCA Register.
5. `productLabel` chosen.
6. `BrandKit` row inserted, paired with the `retailers` row from [adoption path](/implementation/retailers/adoption-path/).
7. Smoke test on a staging URL: rep tablet, customer phone, admin portal. Visually verify all three.
