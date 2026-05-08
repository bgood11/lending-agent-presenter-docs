---
title: Principles and SMCR
description: Which FCA Principles touch the product (Principles 6, 7, 9, 12) and the senior-manager mapping (SMF1, SMF21) a retailer should expect to maintain.
---

The FCA's Principles for Businesses (PRIN) and the Senior Managers and Certification Regime (SMCR) provide the high-level conduct framework and the named-individual accountability structure that sit above the day-to-day CONC rules. This page sets out which Principles bear on a Presenter deployment and the senior-manager mapping a retailer should expect to maintain.

## The Principles

PRIN 2.1.1R sets out twelve Principles. Four bear materially on a Presenter deployment.

**Principle 6 (customer's interests).** "A firm must pay due regard to the interests of its customers and treat them fairly."

The platform supports Principle 6 through the every-option-every-time presentment posture. There is no per-customer suppression of less-attractive options for the broker, no commission-driven re-ordering of the comparison grid, and no nudging copy beyond the small dismissable rep-recommendation cue. The catalogue ordering is per-skin static, defined in `lib/catalogue.ts`, and a change is a code change. The audit log records the catalogue version that was rendered, so a future review can verify the customer saw the same set of options as every other customer that week.

**Principle 7 (communications with clients).** "A firm must pay due regard to the information needs of its clients, and communicate information to them in a way which is clear, fair and not misleading."

This is the Principle that CONC 3.5 (financial promotions) implements at a more concrete level. The platform's option-rendering, the four acknowledgement statements at GCSE-grade reading level, and the PDF preview's full SECCI-shaped artefact are the platform features that respond. See [CONC 3.5](conc-3-5/) for the form rules and [CONC 4.2](conc-4-2/) for the substance.

**Principle 9 (customers: relationships of trust).** "A firm must take reasonable care to ensure the suitability of its advice and discretionary decisions for any customer who is entitled to rely upon its judgment."

A point-of-sale credit broker is in a relationship of trust with the customer at the moment of decision. Principle 9 requires the firm to take reasonable care that any recommendation is suitable. The platform supports this with the rep-recommendation feature on the customer card (a small visual cue, not a dominant pill), the budget calculator that surfaces the affordability question explicitly, and the audit log that records the recommendation made and the customer's pick.

A retailer's recommendation policy (when reps are permitted to recommend an option, what training they receive, what the supervisory regime looks like) is the retailer's responsibility. The platform does not replace the policy; it makes the recommendation auditable.

**Principle 12 (Consumer Duty).** "A firm must act to deliver good outcomes for retail customers."

This is the Consumer Duty, treated at length in [Consumer Duty](consumer-duty/).

Principles 1 (integrity), 2 (skill, care and diligence), 3 (management and control), 4 (financial prudence), 5 (market conduct), 8 (conflicts of interest), 10 (clients' assets), and 11 (relations with regulators) all apply at the firm level but are not directly engaged by a particular Presenter feature. Principle 8 (conflicts of interest) is engaged by the commission-disclosure work in [CONC 3.5](conc-3-5/) and the FCA's CP25/27 motor-finance line; the retailer's commission-disclosure configuration in `lib/skins.ts` is the platform's contribution to that.

## The Senior Managers and Certification Regime

SMCR maps named individuals at the regulated firm to specific responsibilities. For a retailer holding a credit-broking permission (the typical Presenter deploying party), the relevant senior manager functions are:

- **SMF1 (Chief Executive).** Overall accountability for the firm's conduct, including the conduct of regulated activity performed through the platform.
- **SMF3 (Executive Director).** Where the firm has a board, executive directors hold collective responsibility for conduct.
- **SMF21 (EEA Branch Senior Manager).** Where the regulated firm operates as an EEA branch, this function is the senior manager responsible for the branch's regulated activity.
- **SMF16 (Compliance Oversight).** The named function responsible for the firm's compliance function. The compliance officer's review of the platform's audit log, FOS handling, and consumer-duty monitoring sits here.
- **SMF17 (Money Laundering Reporting Officer).** Less directly engaged, because Presenter does not perform CDD, but the MLRO's posture on the broker-lender hand-off boundary is a documented responsibility.

The Statement of Responsibilities for each named individual should describe the platform's role in the firm's regulated activity. A typical SoR addition for SMF1 or SMF16 reads:

> The Senior Manager has accountability for the conduct of regulated credit-broking activity performed via the [Lending Agent Presenter] platform, including: ensuring that the platform's pre-contract presentment and customer-acknowledgement flow satisfies CONC 4.2 and CONC 3.5; ensuring that the platform's audit log is reviewed in the firm's regular conduct-monitoring cycle; ensuring that vulnerability indicators (when implemented) trigger the firm's vulnerability process; and ensuring that the platform's processor and sub-processor relationships are documented and reviewed under UK GDPR Article 28.

The retailer's Management Responsibilities Map (MRM) is updated to reflect the function-by-function allocation.

## Conduct Rules

SMCR's Conduct Rules apply to all employees of the regulated firm (with a slightly different cut for senior managers). The Tier 1 Individual Conduct Rules most relevant to rep-tablet use are:

- ICR 1: "You must act with integrity."
- ICR 2: "You must act with due skill, care and diligence."
- ICR 3: "You must be open and cooperative with the FCA, the PRA and other regulators."
- ICR 4: "You must pay due regard to the interests of customers and treat them fairly."
- ICR 5: "You must observe proper standards of market conduct."
- ICR 6 (introduced with the Consumer Duty): "You must act to deliver good outcomes for retail customers."

A rep using the rep tablet at point of sale is bound by these rules. The retailer's rep training and rep supervision is the operational implementation; the platform's audit log, in particular the rep-name capture, the IP, the user-agent, and the timestamp, supports the retailer's ability to investigate a rep-side breach.

## Documentation expected of a retailer

A retailer with an FCA credit-broking permission preparing to deploy Presenter is expected to have:

- A current MRM showing the senior-manager allocation.
- A Statement of Responsibilities for each senior manager, updated for the platform's role in regulated activity.
- A documented conduct-monitoring cycle that includes review of the platform's audit log and KPI dashboard.
- Training materials for reps that align the platform's design choices (no pressure tactics, async default) with the firm's expected rep behaviour.
- A vulnerability policy aligned with FG21/1, with the platform's audit-log signals identified as one input.
- A complaints procedure that incorporates audit-log replay as a standard investigative step.

The implementation/for-retailers section of this docs site provides templates the retailer can adapt for each.

## Where this sits

This page is the highest-level regulatory mapping in the section. Detail on Consumer Duty is in [Consumer Duty](consumer-duty/), on CONC 4.2 in [CONC 4.2](conc-4-2/), on CONC 3.5 in [CONC 3.5](conc-3-5/), on FG21/1 in [vulnerable customers](vulnerable-customers/), and on the audit log's evidential shape in [audit as evidence](audit-as-evidence/). The Principles bind at the firm level; the rules implement; the platform provides the substrate.
