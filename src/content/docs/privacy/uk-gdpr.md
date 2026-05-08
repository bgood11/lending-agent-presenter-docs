---
title: UK GDPR
description: Article-by-article mapping of UK GDPR obligations to Lending Agent Presenter, including lawful basis, subject rights, and the SYSC 9 retention exemption.
---

UK GDPR (the retained version of Regulation (EU) 2016/679 as it forms part of UK law, supplemented by the Data Protection Act 2018 and amended by the Data (Use and Access) Act 2025) is the applicable data-protection regime for any Presenter deployment. This page maps the specific articles a deploying retailer needs to think about, and explains how the platform's architecture supports each.

## Article 5: principles

UK GDPR Article 5(1) sets out six principles. Each maps cleanly to a design decision in Presenter.

- **Lawfulness, fairness, transparency (Article 5(1)(a)).** Lawful basis is contract performance (see Article 6 below). Transparency is delivered via the magic-link email/SMS body, which states the retailer's identity, the purpose (acknowledging a finance option), and the link to the retailer's privacy notice.
- **Purpose limitation (Article 5(1)(b)).** Customer name, email, and mobile are used solely for magic-link delivery and audit-log attribution. They are not used for marketing.
- **Data minimisation (Article 5(1)(c)).** Seven personal-data fields, total. No date of birth, no address, no employment status. Detail in [data minimisation](data-minimisation/).
- **Accuracy (Article 5(1)(d)).** The customer can re-open the magic link until expiry and contact the rep to correct typed details before confirming. Post-confirmation, the audit log records what was confirmed; rectification of historical records under Article 16 is handled via the retailer's data subject rights process.
- **Storage limitation (Article 5(1)(e)).** Confirmed records are retained for 7 years (SYSC 9). Unconfirmed records have PII purged at 28 days. Detail in [retention](retention/).
- **Integrity and confidentiality (Article 5(1)(f)).** TLS in transit, HMAC-signed magic-link tokens, append-only audit log, role-based admin access via retailer SSO. Detail in [tampering and replay](../safety/tampering-and-replay/).

## Article 6: lawful basis

Two Article 6 bases apply.

**Article 6(1)(b) (contract).** Processing is necessary for steps taken at the data subject's request prior to entering into a contract. The customer is at the retailer's premises (or has made an online enquiry) and has asked to see finance options for the goods they intend to purchase. Generating the receipt, sending the magic link, and recording the acknowledgement are precisely the steps required to put a personalised pre-contract document in their hands. This is the basis for the four customer-facing fields (name, email, mobile, chosen option) and the four acknowledgement booleans.

**Article 6(1)(c) (legal obligation).** The audit log is processed because the retailer is bound by FCA SYSC 9.1.1R to maintain adequate business records, and by CONC 4.2 to evidence that adequate explanations were provided. The legal obligation is on the retailer, and Article 6(1)(c) is the appropriate basis.

Legitimate interests (Article 6(1)(f)) is not relied on. There is no legitimate-interests assessment to perform.

## Article 9: special category data

The v1 surface does not process special category data. There are no health, racial, religious, political, biometric, or sex-life fields collected. The four acknowledgement statements are about the customer's understanding of the credit agreement, not about the customer themselves.

The planned post-v1 vulnerability indicator workflow ([vulnerable customers](../regulatory/vulnerable-customers/)) introduces optional indicators that may reveal health information. When that work lands, the lawful basis for those indicators will be Article 9(2)(a) (explicit consent) supported by Schedule 1 Part 2 of the DPA 2018 where the retailer relies on substantial public interest. That is documented now so retailers planning ahead can scope it; it is not in v1.

## Article 13: information at the point of collection

The retailer's privacy notice carries the Article 13 information. Presenter renders a footer link to that notice on every customer-facing surface (the magic-link email, the magic-link SMS, the customer phone receipt, and the static PDF preview).

Article 13(1) and 13(2) require a specific list of information items at the point of collection. The retailer's notice covers:

- Identity and contact details of the controller (the retailer)
- Contact details of the DPO if the retailer has appointed one
- Purposes of the processing and the lawful basis (contract under Article 6(1)(b), legal obligation under Article 6(1)(c) for the audit log)
- Recipients of the personal data (the platform processor, the email/SMS sub-processors, the lender as a separate controller after hand-off)
- Retention period (7 years for confirmed records, 28 days for unconfirmed PII)
- Subject rights as set out in Articles 15 to 22
- Right to lodge a complaint with the ICO

Presenter does not author this notice. It surfaces a link to the retailer's notice. The implementation/for-retailers section provides a template the retailer can adapt.

## Articles 15 to 22: data subject rights

Each right is supportable from the data Presenter holds.

**Article 15 (access).** A subject access request is fulfilled by exporting the customer's quote record and all audit events keyed by the customer's email or mobile. The admin portal in production exposes a "subject access export" function that produces a JSON bundle plus a human-readable PDF.

**Article 16 (rectification).** Pre-confirmation, the customer asks the rep to issue a corrected quote (the original is marked `superseded` in the audit log; the new one carries a fresh quote ID). Post-confirmation, the audit log is the historical record and is not editable; rectification of forward-going processing is handled via the retailer's wider customer record systems.

**Article 17 (erasure).** Erasure is constrained by the SYSC 9 retention exemption (see below). Customer email and mobile in the operational queue are erased on request within 30 days; the audit-log records that depend on those identifiers for evidential value are subject to the legal-obligation exemption under Article 17(3)(b) and are retained for the 7-year window. The retailer's response to an erasure request explains this trade-off, citing SYSC 9 and the relevant CONC provision.

**Article 18 (restriction).** Restriction is implemented by flagging the quote record `restricted: true`, which the admin portal honours by hiding the quote from the standard list and detail views while preserving it in storage.

**Article 20 (portability).** Portability applies to data the subject provided directly. The customer's name, email, mobile, and the four acknowledgement booleans qualify. The export is a JSON document delivered via the same subject-access endpoint.

**Article 21 (objection).** No marketing or profiling, so no Article 21(2) objection is meaningful. Article 21(1) objections to processing on legitimate-interests grounds are not applicable because legitimate interests is not relied on.

**Articles 22A to 22D (automated decision-making, as inserted by the Data (Use and Access) Act 2025).** Presenter does not make decisions. The model is non-AI; the surface presents finance options computed from a static catalogue. The lender's underwriting decision is out of scope and is governed by the lender's own automated decision-making analysis.

## Article 25: data protection by design and by default

The design choices that satisfy Article 25 are documented across this section. The seven-field minimum, the magic-link token format that excludes PII, the post-confirmation blocklist, and the storage tiering with differentiated retention all flow from this article. The [DPIA](dpia/) page provides the formal assessment a retailer can adapt for its own deployment.

## Article 28: processor obligations

The contractual relationship between the retailer (controller) and the platform (processor) is governed by Article 28. The standard processor commitments are:

- Process only on documented instructions from the controller
- Ensure persons authorised to process personal data are subject to confidentiality
- Take all measures required pursuant to Article 32 (security)
- Engage sub-processors only with prior written authorisation, with flow-down terms
- Assist the controller in responding to subject rights requests
- Assist with Article 32 to 36 obligations (security, breach notification, DPIA)
- Delete or return personal data at end of provision of services
- Make available all information necessary to demonstrate compliance, allow audits

The DPA template the retailer signs with the platform operator covers each of these. The template is in the implementation/for-retailers section.

## Article 32: security of processing

Technical and organisational measures appropriate to the risk are documented in the [safety](../safety/overview/) section: HMAC-signed magic-link tokens, rate limiting, append-only audit log, retailer-SSO admin portal in production. These are the Article 32 controls.

## Article 33 to 34: breach notification

A personal-data breach (loss, alteration, unauthorised disclosure, unauthorised access) is reported to the retailer-controller within 24 hours of detection by the platform. The retailer assesses and, where the breach is likely to result in a risk to the rights and freedoms of natural persons, notifies the ICO within 72 hours per Article 33. High-risk breaches require notification of affected data subjects per Article 34.

The platform's incident-response runbook is documented in the deploy/production-hardening section.

## SYSC 9 retention exemption

UK GDPR Article 5(1)(e) requires data to be kept no longer than necessary. Article 17(3)(b) carves out an exemption where processing is necessary for compliance with a legal obligation in UK law. FCA SYSC 9.1.1R imposes a recordkeeping obligation on the retailer (as a credit broker), and the relevant CONC and CCA provisions extend the retention horizon for consumer credit records to seven years from the end of the customer relationship.

Presenter's seven-year retention on confirmed records and audit events sits inside this exemption. The retailer's privacy notice and any erasure-request response explain the position. The [retention](retention/) page sets out the field-by-field schedule and the trigger conditions.
