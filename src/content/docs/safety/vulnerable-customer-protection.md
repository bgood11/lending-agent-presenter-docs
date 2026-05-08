---
title: Vulnerable customer protection
description: How the surface design takes pressure off the customer, mapped to FCA Vulnerable Customers Guidance FG21/1.
---

The FCA Vulnerable Customers Guidance (FG21/1, "Guidance for firms on the fair treatment of vulnerable customers", February 2021) frames vulnerability around four drivers: health, life events, resilience, and capability. A customer in any of those situations is more likely to be harmed by surfaces that compress their time, anchor them to a particular product, or push them past disclosures they have not absorbed.

Lending Agent Presenter is the surface where a customer at point of sale meets a regulated credit decision. The design choices on the customer phone surface are the controls that determine whether the surface contributes to vulnerability harm or mitigates it. This page explains those choices and the FG21/1 obligations they map to.

## The four drivers and the surface response

**Health.** Cognitive impairment, fatigue, anxiety in a clinical setting (relevant to the Bright Lane Dental skin in particular), and chronic conditions reduce a customer's ability to absorb information at speed. The customer phone surface is async by default. The rep clicks "Send to customer" rather than handing over a tablet. The customer reads the receipt at home, in their own time, on their own device. They can re-open the link until expiry (default 14 days) and pick the moment they feel able to make the decision.

**Life events.** Bereavement, divorce, redundancy, and house moves are situations where customers are more prone to commit to finance they will later regret. The surface does not tell them about the goods or push them to commit; it presents the options the rep has built and asks them to pick one. The surface has no upsell, no cross-sell, no "while you are here" prompt.

**Resilience.** Low income, low savings, debt overhang, and unstable employment are forms of low financial resilience. The budget calculator on the customer phone (`components/customer/budget-calculator.tsx`) lets the customer set a target monthly figure and see immediately which options sit at or below that. It surfaces the target-monthly question explicitly rather than defaulting to the cheapest-headline-monthly option. This nudges the customer toward an affordability-first decision rather than a sticker-shock-first one.

**Capability.** Low financial literacy, low English-language fluency, and low digital confidence all reduce a customer's ability to read a quote correctly. The four acknowledgement statements in `components/customer/acknowledgement-checklist.tsx` are written in plain English, at GCSE-grade reading level, with no jargon and no nested clauses. The PDF preview is rendered as a styled HTML block that the customer can scroll through; it is not a download-and-open flow that gates the decision behind a desktop application.

## Specific design choices

A surface contributes to vulnerability harm through a small number of well-known patterns. Lending Agent Presenter explicitly does not use any of them.

- **No countdown timers.** The customer phone has no "this offer expires in 14:59" timer. The link expires in 14 days, and that is communicated as a calendar date ("link expires Tuesday 22 May"), not a countdown. Countdown timers are a known dark pattern that drives anxious customers to commit faster than they can think.
- **No artificial scarcity.** There is no "only 2 of these spots left" or "3 customers viewing now" copy on the customer phone. Every contracted finance option is shown to every customer; there is no sense in which an option is scarce.
- **No anchoring tactics.** The options render in catalogue order (defined per skin in `lib/catalogue.ts`), not sorted by lender preference or commission. The rep can mark one option as their recommendation, which renders as a small visual cue rather than a "RECOMMENDED" pill that dominates the layout. The budget calculator re-sorts by affordability, not by retailer preference.
- **No pre-ticked acknowledgements.** The four checkboxes in the acknowledgement checklist start unchecked. The "Confirm" button is disabled until all four are checked plus an option is picked. There is no path to confirm without explicit consent on each statement.
- **No dark-pattern copy.** The acknowledgement statements are stated as plain first-person sentences ("I understand I must make the minimum repayment each month"). They are not framed as opt-outs ("Untick if you do not understand") or double negatives.
- **No coercive defaults.** The "Send to customer" path is the default and is selected by default on the rep tablet. The "Customer present, ack now" in-store fallback exists for customers without a phone or without the means to read it later (themselves a vulnerability marker), and it requires an explicit click. The rep cannot accidentally collapse the async flow into a synchronous one.

## FG21/1 mapping

The guidance asks firms to consider four areas: understanding the needs of vulnerable customers, ensuring staff have skills and capability, taking practical action, and monitoring and evaluating the impact.

**Understanding the needs.** The audit log captures which customers re-opened the magic link multiple times, took longer than the median to confirm, abandoned, or escalated to a phone call with the retailer. These are signals the retailer can analyse and that, in production, feed into a vulnerability indicator workflow (a planned post-v1 feature, documented in the implementation/for-brokers section).

**Staff skills.** Rep training is the retailer's responsibility, not Presenter's. The rep tablet supports it by removing pressure to push a particular option (the cards are catalogue-ordered, not commission-ordered) and by making "Send to customer" the default flow.

**Practical action.** The async magic-link flow is the practical action. It removes the in-store handover step that drives the largest volume of vulnerability complaints in competitor products (where the rep watches the customer tick boxes on the rep's own tablet). The customer reads, picks, and confirms on a device they own.

**Monitoring and evaluation.** The admin portal's KPI dashboard exposes acknowledgement rate, time-to-confirm distribution, and abandonment rate. These are the observable proxies for whether customers are completing the journey comfortably. A retailer running a high abandonment rate on a particular skin or rep should investigate, and the audit-log replay supports that investigation.

## Planned: vulnerability indicator workflow

A post-v1 enhancement, documented at engineering-spec depth in the regulatory section ([vulnerable customers](../../regulatory/vulnerable-customers/)). The customer surface offers an optional "Anything we should know to support you?" disclosure prompt, with closed-option indicators rather than free text. Triggers for slowed pacing, escalation to a phone call, or referral to a debt-advice signpost are derived from the indicators. The indicators are special category data under UK GDPR Article 9; their handling is detailed in the privacy section.

## What this section is not

This page is not a substitute for the retailer's own vulnerability policy. It documents how the surface contributes to or detracts from FG21/1 outcomes and what design choices flow from that. The retailer holds the FCA permission and is the entity FG21/1 binds; Presenter is the tool, and the tool is built so that a compliant retailer can comply.
