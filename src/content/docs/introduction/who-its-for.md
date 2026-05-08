---
title: Who it's for
description: Two audiences. Big-ticket retailers presenting credit options at point of sale, and credit brokers running pilots with retailer panels.
---

Two audiences hold the FCA permission and the customer relationship. The product fits both shapes.

## For retailers

Big-ticket retailers operating in solar, kitchens, dentistry, home improvement, and similar verticals where the order value sits between £1,500 and £30,000 and the customer typically asks "how much a month". The retailer holds the FCA credit-broking permission. The retailer's reps work the showroom or the home consultation. The customer signs the credit agreement separately with the chosen lender.

Adoption shape:

1. Onboard the catalogue. The retailer hands their lender contracts and IFC limits to the implementation team. The team encodes them as a `FinanceProduct[]` in the catalogue file.
2. Configure the skin. Brand colour, logo SVG, FCA register number, footer compliance text. One file edit per retailer.
3. Issue the signed retailer URL. Reps open it on tablets in the showroom. No per-rep authentication. Rep name is captured once into localStorage on first load.
4. Run the rep tablet, customer phone, admin loop. The admin portal shows acknowledgement rate, average quote value, top rep, and the full audit timeline per quote.

A pilot is one retailer, one skin, one catalogue, two-to-six weeks. Acceptance criteria are the acknowledgement rate (target 60% of quotes acknowledged within 14 days) and the audit completeness (every acknowledged quote has a full five-event timeline).

See [Implementation, For retailers](/implementation/retailers/adoption-path/) for the full adoption playbook.

## For brokers

Credit brokers who run a panel of retailers and want to standardise the customer journey across the panel. The broker holds the FCA permission and contracts with retailers. Lending Agent Presenter sits between the broker's panel agreement and the lender API.

Adoption shape:

1. The broker's compliance team approves the four CONC 4.2 acknowledgement texts and the SECCI / pre-contract templates. These are skin-independent.
2. Each retailer in the panel gets its own skin. The broker's compliance posture sits at the catalogue level (which lenders, which APRs, which IFC offers) rather than the retailer level.
3. The broker's audit team gets read access to the admin portal across the whole panel. The data model supports retailer-level filtering on every admin route.

The broker can also act as the implementation partner for vulnerability process, complaint handling, and lender reconciliation. The product does not hold those workflows itself.

See [Implementation, For brokers](/implementation/brokers/adoption-path/) for the broker-specific deployment shape, permissions matrix, and audit-evidence integration.

## Outside scope

- Direct-to-consumer lending. The product is a presentment tool, not a lender.
- Unsecured personal loans without a regulated retail context. CONC 4.2 framing is the design centre.
- Markets outside the UK. Currency, regulator, language, and consumer-credit framing are UK-only in v1.
