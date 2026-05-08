---
title: Regulatory overview
description: Map of the FCA regulations that govern a Lending Agent Presenter deployment, with Consumer Duty as the umbrella and CONC 4.2 as the day-to-day anchor.
---

A Presenter deployment sits inside a layered FCA regime. The umbrella is the Consumer Duty (Principle 12 plus PRIN 2A); the day-to-day governing rules are CONC 4.2 (adequate explanations of credit agreements) and CONC 3.5 (financial promotions); the customer-protection floor is FG21/1 on vulnerable customers; the governance scaffold is the Principles for Businesses and SMCR. This page sets out the map. Each detail page in this section drills into the regulation, the textual obligations, and the platform features that respond.

The presumption running through this section is that the **retailer holds the FCA credit-broking permission** and is the regulated entity. Lending Agent Presenter is a tool sold to the retailer; the platform operator is not itself an FCA-authorised firm performing the broking activity, and this section is written from the retailer's perspective rather than the platform's.

## The umbrella: Consumer Duty

The Consumer Duty (FCA Policy Statement PS22/9, "A new Consumer Duty", July 2022, in force 31 July 2023) introduced PRIN 2A and elevated the customer-outcomes obligation to a standalone Principle (Principle 12: "A firm must act to deliver good outcomes for retail customers"). The Duty replaces a checklist-based compliance posture with an outcomes-focused accountability that the firm must monitor and demonstrate.

Three cross-cutting rules apply across the entire customer relationship: act in good faith; avoid foreseeable harm; enable customers to pursue their financial objectives. Four outcomes structure the Duty's substantive requirements: products and services, price and value, consumer understanding, and consumer support.

The [Consumer Duty](consumer-duty/) page maps each outcome to specific platform features.

## The day-to-day rules: CONC

The Consumer Credit sourcebook (CONC) carries the rules that govern a credit broker's day-to-day customer interactions. Two chapters dominate a Presenter deployment.

**CONC 4.2** ("Pre-contractual requirements"). The firm must provide adequate explanations of the credit agreement before it is entered into, in such a manner as to put the customer in a position to assess whether the agreement is adapted to their needs and financial situation. CONC 4.2.5R sets out specific matters that must be explained. The four customer acknowledgement statements at the end of the customer phone surface map to these matters. The [CONC 4.2](conc-4-2/) page is the substantive regulatory anchor for the platform.

**CONC 3.5** ("Financial promotions and communications with customers: credit brokers and lenders"). Quotations, representative APRs, and the way finance options are communicated to the customer are governed here. The customer-facing PDF receipt and the option-comparison grid render figures in the form CONC 3.5 prescribes; the [CONC 3.5](conc-3-5/) page sets out the form rules.

Adjacent chapters that touch the platform less directly:

- **CONC 5.2A** (creditworthiness) is the lender's responsibility, not the broker's, and is out of scope here.
- **CONC 7** (arrears, default and recovery) is post-contract and out of scope.
- **CONC 2.7** (commission disclosure) is heightened by the FCA's motor-finance work and is documented in the [CONC 3.5](conc-3-5/) page.

## The customer-protection floor: FG21/1

The FCA's Vulnerable Customers Guidance (Finalised Guidance FG21/1, "Guidance for firms on the fair treatment of vulnerable customers", February 2021) sets out the four drivers of vulnerability (health, life events, resilience, capability) and the firm's obligations to identify, respond to, and monitor vulnerability across the customer relationship. The platform's design choices on the customer phone surface (async pacing, no countdown timers, plain-English copy, accessibility floor) flow from FG21/1. The [vulnerable customers](vulnerable-customers/) page is the mapping.

## The governance scaffold: Principles and SMCR

The FCA's Principles for Businesses (PRIN) bind the regulated firm at the highest level. Principle 6 ("A firm must pay due regard to the interests of its customers and treat them fairly"), Principle 7 ("A firm must pay due regard to the information needs of its clients, and communicate information to them in a way which is clear, fair and not misleading"), Principle 9 ("A firm must take reasonable care to ensure the suitability of its advice and discretionary decisions for any customer who is entitled to rely upon its judgment") and Principle 12 (Consumer Duty) all bear on a Presenter deployment.

The Senior Managers and Certification Regime (SMCR) maps named individuals at the retailer to specific responsibilities. The two functions that intersect a Presenter deployment most are SMF1 (Chief Executive) for overall accountability and SMF21 (EEA Branch Senior Manager) where applicable. The [Principles and SMCR](principles-smcr/) page sets out the senior-manager mapping a retailer should expect to maintain.

## Consumer Credit Act 1974 and the audit log

The Consumer Credit Act 1974 (CCA) provides the statutory framework that CONC overlays. Two CCA sections matter for the audit log:

- **Section 55** (information for debtors) requires pre-contract disclosure of specified matters. The four acknowledgement statements at the end of the customer phone surface document the customer's confirmation that those matters were communicated.
- **Section 140A to 140C** (unfair relationships) gives the courts power to reopen an agreement where the relationship between debtor and creditor is unfair. Defending a 140A claim requires the firm to reconstruct the pre-contract conversation; the audit log is the artefact that supports that reconstruction. The [audit as evidence](audit-as-evidence/) page sets out the defence shape in detail.

## Where this section sits relative to safety and privacy

The safety section covers threats to the platform (URL leak, scraping, replay, tampering). The privacy section covers UK GDPR and the data-protection regime. This section covers the FCA conduct rules. The three are independent regimes and a Presenter deployment must satisfy all three; the relevant cross-references between sections are given in each page.

The intended outcome of reading this section is that a reviewer can answer, with reference to specific files and specific regulatory rules: which obligations bind the retailer, which platform features evidence compliance, and what shape a defence under each rule would take.
