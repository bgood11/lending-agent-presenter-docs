---
title: Vulnerable customers
description: FG21/1 obligations and how the surface design responds, with a planned vulnerability indicator workflow for post-v1.
---

The FCA's Vulnerable Customers Guidance (Finalised Guidance FG21/1, "Guidance for firms on the fair treatment of vulnerable customers", February 2021) sets out the substance of the firm's obligation to identify, respond to, and monitor vulnerability across the customer relationship. The guidance is non-binding in the strict sense, but it is the FCA's published expectation and is the basis on which supervisory and enforcement action is taken. The Consumer Duty (PS22/9, see [Consumer Duty](consumer-duty/)) elevates and codifies much of FG21/1 into the Principle 12 framework.

This page sets out the four drivers of vulnerability, how the surface design responds to each, and the planned vulnerability indicator workflow that will extend the response in a post-v1 release.

## The four drivers

FG21/1 frames vulnerability around four drivers. A customer in any one of them is more likely to be harmed by a surface that compresses time, anchors choice, or pushes past disclosures the customer has not absorbed.

**Health.** Cognitive impairment, mental-health conditions, sensory impairments, fatigue in clinical settings (relevant in particular to the Bright Lane Dental skin), chronic pain, and conditions that affect concentration. The customer phone surface is async by default. The customer reads at home, in their own time, on their own device, and can re-open the magic link until expiry (default 14 days). The acknowledgement checklist is not a synchronous handover step; the customer ticks at their own pace and confirms when they are ready.

**Life events.** Bereavement, divorce, redundancy, house moves, becoming a carer, recent immigration. Customers in life-event situations are more prone to commit to finance they will later regret and are more vulnerable to high-pressure sales tactics. The platform's customer surface has no pressure tactics: no countdown timer, no scarcity copy, no "while you are here" upsell, no pre-ticked acknowledgements. The default flow is async, separating the moment of decision from the moment of in-store contact.

**Resilience.** Low income, low savings, debt overhang, unstable employment, no safety-net relationships. The budget calculator on the customer phone (`components/customer/budget-calculator.tsx`) lets the customer set a target monthly figure and re-sorts the option grid by what fits. This nudges the customer toward an affordability-first decision rather than a sticker-shock-first one. Options that exceed the target are visually de-emphasised (greyed out) but not hidden, so the customer retains visibility of every contracted option.

**Capability.** Low financial literacy, low English-language fluency, low digital confidence, low numeracy. The four acknowledgement statements are written at GCSE-grade reading level, in the first person, with no jargon. The PDF preview is rendered as a styled HTML block the customer can scroll through; it is not a download-and-open flow that gates the decision behind a desktop application. The receipt header surfaces the periodic payment in a single sentence ("£253 a month for 60 months, total £15,180") that the customer can read and remember without holding multiple figures in their head.

## The four firm obligations

FG21/1 sets out four areas of firm obligation: understanding the needs of vulnerable customers; ensuring staff have skills and capability; taking practical action; monitoring and evaluating the impact.

**Understanding the needs.** The audit log captures observable signals: how many times the customer re-opened the magic link, how long elapsed between open and confirm, whether the customer abandoned, whether the customer escalated to a phone call with the retailer (the implementation/for-retailers page explains the call-back integration). These are proxies for vulnerability and are the substrate on which a retailer's vulnerability process can run.

**Staff skills.** Rep training is the retailer's responsibility. The platform supports it by removing pressure to push a particular option (the cards are catalogue-ordered, not commission-ordered) and by making "Send to customer" the default flow. A rep cannot accidentally collapse the async flow into a synchronous one; selecting the in-store fallback requires a deliberate click.

**Practical action.** The async magic-link flow is the practical action. It removes the in-store handover step that drives the largest volume of vulnerability complaints in alternative tools, where the customer is asked to acknowledge on the rep's tablet under the rep's eye. Presenter's customer reads on a device they own, in a place they choose.

**Monitoring and evaluation.** The admin portal's KPI dashboard exposes acknowledgement rate, time-to-confirm distribution, and abandonment rate, broken down by skin and rep. A retailer running an unusually high abandonment rate on a particular skin or rep should investigate; the audit-log replay supports the investigation.

## The four-driver mapping, in summary

| Driver | Surface response | Audit-log signal |
|---|---|---|
| Health | Async magic-link flow; 14-day expiry; re-openable until confirm | Multiple opens, long time-to-confirm |
| Life events | No pressure tactics; default async; no upsell | Time-to-confirm, abandonment |
| Resilience | Budget calculator with target-monthly slider | Picked option's monthly < target |
| Capability | Plain-English acknowledgements; PDF preview in-page | Time spent on PDF preview, multiple opens |

## Planned vulnerability indicator workflow

The v1 surface delivers the FG21/1 obligations through the design choices above, plus the audit-log monitoring substrate. A post-v1 enhancement extends the response with an explicit vulnerability indicator workflow.

The proposed shape:

- A short optional disclosure prompt on the customer phone surface, after the option pick and before the acknowledgement checklist: "Anything we should know to support you?"
- Closed-option indicators rather than free text: "I've recently been bereaved", "I have a long-term health condition", "I'm currently using a food bank", "English is not my first language", "I'd like to be contacted by phone before signing".
- Indicator selection is optional and is recorded in the quote record as a structured field.
- Indicator selection triggers retailer-configurable actions: slowed pacing on the surface (a 24-hour minimum between option pick and confirmation enable), automatic escalation to a phone call with the retailer's vulnerability-trained staff, signposting to debt-advice charities, omission of certain options from the comparison grid (the BNPL options for a customer in a resilience-driver situation, for example).

The indicators are special category data under UK GDPR Article 9 (a long-term health condition is a health field). Their handling requires:

- A separate Article 9 lawful basis. Article 9(2)(a) (explicit consent) is the natural fit; the customer ticks a "Yes, share these to support me" confirmation before the indicators are recorded.
- A separate retention horizon. Indicators are short-tail data; they support a single customer interaction and do not need the seven-year SYSC 9 retention. Default proposed: 12 months from `confirmedAt`, then erased.
- A separate DPIA addendum. The v1 DPIA template ([DPIA](../privacy/dpia/)) is scoped to the v1 surface; introducing Article 9 indicators is a material change requiring a fresh assessment.
- Care with the audit-log shape. The `quote.confirmed` event must capture the indicator state for evidential value; the indicator state must not propagate to the lender hand-off without a separate consent.

This workflow is documented now so retailers planning ahead can scope it. It is not in v1 and the v1 surface does not collect it.

## Where this sits relative to safety

The [vulnerable customer protection](../safety/vulnerable-customer-protection/) page in the safety section covers the same regulatory anchor (FG21/1) but from the threats-and-mitigations angle: which patterns drive harm and which design choices avoid them. This regulatory page covers the same ground from the firm-obligation angle: what FG21/1 expects and how the platform helps the retailer satisfy it. The two are intentionally complementary; a reviewer might read either or both depending on whether they are auditing the threat surface or the regulatory posture.
