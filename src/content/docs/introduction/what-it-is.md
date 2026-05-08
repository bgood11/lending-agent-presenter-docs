---
title: What it is
description: A menu-style finance presentment tool. Every contracted option, every customer, every time.
---

Lending Agent Presenter is a menu-style finance presentment tool for big-ticket retailers. A sales rep opens a signed retailer URL, types the price and the customer's contact details, and the screen renders every contracted finance option side-by-side: deposit, monthly, total payable, term, key feature one-liner. The rep sends a magic link to the customer's phone. The customer compares, picks, acknowledges the four key features required under CONC 4.2, and confirms. The retailer admin portal shows the full audit trail.

The principle is one line: every option, every customer, every time.

## The three retailer skins

The demo ships with three skins. Each one is a worked example of how a retailer would adopt the tool, with its own brand, FCA register number, finance product catalogue, and customer scenario.

- **Solaris Home Energy** (solar PV plus battery). Sarah Mitchell, 8.5 kWp system, £17,500, 10% deposit. FRN 812374.
- **Hayes & Sons Kitchens** (fitted kitchens). James Tate, shaker kitchen, £24,000, 25% deposit. FRN 624901.
- **Bright Lane Dental** (cosmetic dentistry). Priya Shah, aligner course plus whitening, £8,400, 0% deposit. FRN 738256.

A skin defines a single `--brand-primary` CSS variable, a logo SVG, footer compliance text, and a finance catalogue. Switching skins is presentation-only and changes nothing about the underlying state machine.

## The four surfaces

- **Marketing landing** at `/`: hero with embedded preview, three-step explainer, features grid, comparison vs other competitor tools, audience cards, FAQ, FCA-style footer.
- **Rep tablet** at `/demo/rep`: one-page quote builder. Live finance product cards. "Send to customer" is the default. "Customer present, ack now" is the in-store fallback.
- **Customer phone** at `/demo/customer/[token]`: magic-link receipt. Comparison grid, budget calculator (target-monthly slider), PDF preview, key-feature acknowledgement checklist, confirm.
- **Retailer admin** at `/demo/admin`: dashboard, filterable quote list, per-quote detail with full audit timeline.

## Where it sits in the family

The waterfall sibling, [Lending Agent](https://lending-agent.vercel.app), is an agentic credit broking journey with a sequential lender waterfall. Same brand family, different journey shape. Presenter is the menu-style cousin: every option in parallel, no agent narration, no sequential lender contact.

## What it deliberately is not

- No AI in the product. Lending Agent Presenter is plain UI plus deterministic finance maths. The waterfall sibling is the AI-mediated product.
- No real backend in this v1 demo. State lives in Zustand and URL params. Magic links resolve to a static `demo-token` route. No email is sent, no PDF is generated.
- No regulatory permission held by the tooling. Retailers hold their own FCA credit-broking permission. Lending Agent Presenter is sold as software.
