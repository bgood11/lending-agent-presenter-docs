---
title: Consumer Duty
description: How the four outcomes (products, price/value, consumer understanding, consumer support) are addressed by the menu structure, magic-link flow, PDF artefact, and audit log.
---

The Consumer Duty (FCA PS22/9, "A new Consumer Duty", in force 31 July 2023) is the umbrella regulation governing a Presenter deployment. PRIN 2A elevates customer-outcomes accountability to a standalone Principle (Principle 12: "A firm must act to deliver good outcomes for retail customers"). The Duty is monitored and evidenced rather than checklisted; the firm must demonstrate that customers actually receive good outcomes, not just that the firm followed a process.

This page sets out the three cross-cutting rules and the four outcomes, and shows how the platform's design responds to each.

## The three cross-cutting rules

PRIN 2A.2.1R sets out the cross-cutting rules. A firm must:

- act in good faith toward retail customers;
- avoid causing foreseeable harm to retail customers;
- enable and support retail customers to pursue their financial objectives.

**Acting in good faith.** The platform presents every contracted finance option to every customer, every time. There is no per-quote suppression of less-attractive options for the broker, no commission-driven re-ordering of the comparison grid, and no nudging copy that points the customer toward one option over another beyond a small "rep recommendation" cue that the customer can dismiss. The catalogue ordering is per-skin static, defined in `lib/catalogue.ts`.

**Avoiding foreseeable harm.** The customer phone surface deliberately omits the dark patterns that drive foreseeable harm at point of sale (countdown timers, artificial scarcity, pre-ticked acknowledgements, coercive defaults). The async magic-link flow gives the customer time to read the receipt away from the rep's presence. The four acknowledgement statements are required to be ticked individually before "Confirm" enables; there is no fast path to a confirmed agreement.

**Enabling and supporting customers to pursue their objectives.** The budget calculator surfaces the question the customer is most likely to be asking ("can I afford this monthly?") without the rep having to interpret it for them. The PDF preview is a full readable artefact, not a download-and-open flow that gates the decision behind a desktop application.

## Outcome 1: Products and services

PRIN 2A.3 requires that products and services are designed to meet the needs of an identified target market and are distributed appropriately.

The platform supports this through the per-skin catalogue. Each retailer skin (Solaris, Hayes & Sons, Bright Lane) defines its own catalogue of finance products in `lib/catalogue.ts`, sized and priced for the goods that retailer sells. The catalogue is curated upfront with the lender panel; products that do not fit the target market (a 96-month BNPL on a £900 dental treatment, for example) are not in the catalogue.

The retailer is responsible for the upstream Outcome 1 work: target-market identification, product fair-value assessment, distribution-strategy review. The platform supports the work by making the catalogue explicit, version-controlled, and per-skin auditable. A change to the catalogue is a code change, and code changes are reviewable.

## Outcome 2: Price and value

PRIN 2A.4 requires that the price the customer pays for a product or service is reasonable relative to the benefits.

The platform makes the total cost of every option visible side-by-side. The rep tablet shows monthly, total payable, deposit, and term for every option in the catalogue. The customer phone surface shows the same and adds a "best for low monthly" / "best for total cost" / "fastest to clear" badge set so the customer can see which option is cheapest by which measure.

This is the design that lets the customer make a price-and-value decision rather than a sticker-shock one. A customer optimising for low monthly might pay 30% more in total interest; the platform shows them that trade-off explicitly rather than burying it.

Commission disclosure (CONC 4.5 and CONC 4.5A, heightened by the FCA's motor-finance work in CP25/27) is the retailer's responsibility to render at the right point in the journey. The customer-facing PDF and phone receipt include a commission-disclosure block where the retailer configures one; the [CONC 3.5](conc-3-5/) page covers the placement and content.

## Outcome 3: Consumer understanding

PRIN 2A.5 requires that communications equip retail customers to make effective, timely, and properly informed decisions.

The four customer acknowledgement statements (rendered verbatim from `components/customer/acknowledgement-checklist.tsx`) are the platform's most concrete contribution to Outcome 3. They are written in plain English at GCSE-grade reading level, in the first person, with no jargon and no nested clauses:

- "I understand I must make the minimum repayment each month."
- "I understand I can make overpayments at any time, which could reduce my interest."
- "If I want to overpay, I understand I should contact the lender directly to apply it correctly."
- "I understand the option I've picked is a regulated credit agreement, subject to status."

Each is required to be ticked individually. Each is recorded verbatim in the `quote.confirmed` audit event, with the chosen `productId` and a SHA-256 hash of the quote payload as rendered.

The customer phone surface presents the receipt in language consistent with the four statements; the option cards use the same plain-English vocabulary, the budget calculator uses the same £/month framing, and the PDF preview is the same content in a printable form.

The async magic-link flow itself is an Outcome 3 lever. The customer reads the receipt at home, on their own phone, in their own time. They can re-open until the link expires and pick the moment they feel able to make the decision. This is structurally different from a synchronous handover where the customer feels under time pressure to complete on the rep's tablet.

## Outcome 4: Consumer support

PRIN 2A.6 requires that customers receive support that meets their needs throughout their relationship with the firm.

The platform supports Outcome 4 through three concrete features:

- **Non-destructive abandonment.** A customer who opens the magic link but does not confirm leaves no acknowledgement record. Re-opening later resumes from the same state. There is no "you have abandoned this quote" penalty. After expiry, the link reverts to a read-only "this link has expired, contact the retailer to reissue" state.
- **In-store fallback.** A customer who lacks a phone or wants to complete the journey in store can do so via the rep tablet's "Customer present, ack now" path. The audit log records the channel as `inStoreFallback: true`.
- **Audit-log replay for retailer support staff.** When a customer later contacts the retailer with a question about the agreement they confirmed, the retailer's admin staff can replay the journey from the audit log and see exactly what the customer saw and what they ticked. This is the operational substrate for fair complaint handling and for FOS-grade investigations.

A planned post-v1 vulnerability indicator workflow (documented in [vulnerable customers](vulnerable-customers/)) extends Outcome 4 with closed-option indicators and trigger-based slowed pacing or escalation. That is forward-looking; the v1 surface delivers the support obligations through the features above.

## Evidencing the Duty

PRIN 2A.10 requires firms to monitor outcomes and to act on the findings. The audit log is the primary monitoring substrate. The admin portal's KPI dashboard exposes the observable proxies:

- **Acknowledgement rate** (confirmed quotes / sent quotes), broken down by skin and rep. A low rate signals a population that is not completing the journey, which should trigger a review.
- **Time-to-confirm distribution.** An unusually compressed distribution suggests rep pressure; an unusually long tail suggests customers struggling.
- **Abandonment patterns.** Quotes opened multiple times without confirmation indicate the customer is uncertain; the retailer can investigate the rep, the option mix, or the goods.

The retailer is responsible for closing the monitoring loop: looking at the data, drawing conclusions, and acting. The platform exposes the data; the retailer interprets it.

## Where the Duty intersects other rules

Consumer Duty does not displace the underlying CONC rules; it sits on top of them. A platform that satisfies CONC 4.2 (adequate explanations) and CONC 3.5 (financial promotions) provides the substantive output that Consumer Duty's three cross-cutting rules and four outcomes require, but the Duty also requires the firm to look at customer outcomes in aggregate and act on what it sees. That aggregate-monitoring obligation is what the audit log and the admin KPI dashboard support.
