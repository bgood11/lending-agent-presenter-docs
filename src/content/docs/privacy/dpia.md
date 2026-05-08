---
title: DPIA template
description: Data Protection Impact Assessment template a retailer can adapt for a Lending Agent Presenter deployment, with sections to fill in.
---

A Data Protection Impact Assessment (DPIA) under UK GDPR Article 35 is required where processing is likely to result in a high risk to the rights and freedoms of natural persons. The ICO's published list of operations requiring a DPIA includes "innovative use of new technologies" and several finance-adjacent processing categories. A retailer deploying Presenter as part of a regulated credit-broking journey will commonly conclude that a DPIA is appropriate, even where the processing volumes per location are modest, because the data category (financial decisions, point-of-sale finance) sits within the regulator's heightened-attention list.

This page provides a template the retailer can adapt. The platform-side facts (architecture, sub-processors, security controls) are filled in. The retailer-side facts (deployment scale, business context, risk appetite) are left as placeholders the retailer completes.

## 1. The processing in scope

**Description.** The retailer uses Lending Agent Presenter to present every contracted finance option to a customer at point of sale, capture the customer's acknowledgement of the chosen option's key features on the customer's own phone via a magic-link receipt, and retain the resulting audit trail to evidence compliance with FCA CONC 4.2 (adequate explanations).

**Volume.** [Retailer to fill: estimated quotes per month per site, number of sites, peak/trough.]

**Geography.** UK-only. All data subjects are UK residents at the point of customer interaction. Hosting region: London (`lhr1`) on Vercel.

**Duration.** Ongoing, with the platform under continuous operation during retail trading hours.

## 2. Necessity and proportionality

**Why this processing is necessary.** Pre-contract presentment of every contracted finance option is a CONC 4.2 obligation on the retailer (a credit broker). The retailer must be able to evidence that the customer was given adequate explanations of the credit agreement. Presenter's audit log produces that evidence in a form the retailer can produce on request to the FCA, the FOS, or in defence of a s.140A unfair-relationship claim under the Consumer Credit Act 1974.

**Why this design is proportionate.** The personal data set is held to seven fields (see [data minimisation](data-minimisation/)). The customer device is the customer's own phone, removing the in-store handover step that drives a measurable share of vulnerability complaints in alternative tools. Retention is tied to FCA recordkeeping rather than to a longer marketing or analytics horizon. There is no profiling, no automated decision-making, and no special category data in v1.

**Alternative considered: synchronous in-store acknowledgement on rep tablet.** Available as a fallback for customers without a phone. Default is the async magic-link flow because it gives the customer time to read at their own pace. The audit log distinguishes the two channels with an `inStoreFallback` flag.

**Alternative considered: paper receipt plus wet signature.** Rejected because it produces a non-replayable audit trail (the retailer cannot reconstruct what was on the page when the customer signed) and because it adds physical-document handling and retention overhead the retailer is now exposed to.

## 3. Data subjects, data, and recipients

**Data subjects.** UK consumers at point of sale, plus retailer staff (rep name capture, admin user identity for the audit log).

**Personal data.** Customer name, email, mobile, the goods description (associated with the customer), the chosen finance option, four acknowledgement booleans, IP and user-agent at each surface action. Rep name as a free-text string. Admin user session identifier.

**Special category data.** None in v1. A planned vulnerability indicator workflow would introduce Article 9 data; a separate DPIA addendum is required when that lands.

**Recipients.**

- Vercel (sub-processor, hosting and edge delivery).
- The data store sub-processor (Vercel KV or Postgres on Neon, depending on deployment).
- The email provider sub-processor (Postmark or AWS SES) for magic-link email.
- The SMS provider sub-processor (Twilio or MessageBird) for magic-link SMS.
- AWS S3 (sub-processor, audit-log durable copy with object lock).
- The retailer's chosen lender, as a separate controller after the customer is handed off from the confirmed receipt to the lender's own application surface.

The full per-deployment list with locations and contract types is in [sub-processors](sub-processors/).

## 4. Risks to data subjects

The risks below are scored on a [Likelihood] x [Severity] basis. The retailer adapts the scoring to its own risk framework.

**Risk 1: Magic-link reaches the wrong recipient.** A mistyped customer email or mobile sends the link to the wrong inbox or phone. Severity: medium (a stranger sees the customer's name and the goods description, no APRs or financial figures). Likelihood: low (rep types under supervision, customer typically reads the address back). Mitigation: customer-name match in the email body so a wrong recipient knows; one re-send cap; expiry-then-purge on the email/SMS bodies at the providers; post-confirmation blocklist so a stranger cannot complete the acknowledgement. Residual: low.

**Risk 2: Forwarded magic-link allows acknowledgement by someone other than the named customer.** Severity: medium (the audit-log record names a customer who did not actually consent). Likelihood: low (forwarding requires intent or accident plus the recipient choosing to confirm). Mitigation: IP and user-agent recorded in the audit log; SMS-OTP-on-confirm available as a production hardening option for retailers wanting stronger binding; the customer's contractual route is the named-recipient route. Residual: low to medium.

**Risk 3: Admin portal compromise exposes whole-tenant quote data.** Severity: high (one retailer's customer list, contact details, and finance histories). Likelihood: low if the retailer enforces SSO with MFA and IP allowlisting. Mitigation: production deployment requires retailer SSO; session timeout 30 min idle, 8h absolute; no write paths from admin to audit log; admin reads themselves audited. Residual: low if SSO is enforced; medium if the retailer chooses not to.

**Risk 4: Sub-processor breach (email or SMS provider).** Severity: medium (customer name, contact details, magic-link URLs that have likely already expired by the breach disclosure window). Likelihood: very low (top-tier providers with public security postures). Mitigation: provider selection with SOC 2 attestation; provider-side message-body redaction enabled; short-lived magic-link tokens; blocklist after first confirm. Residual: low.

**Risk 5: Audit-log loss or tampering.** Severity: high (defence under enforcement question is compromised). Likelihood: very low. Mitigation: append-only at the storage layer; daily roll-up to S3 with object lock (compliance mode, 7 years); off-platform copy that no application bug can erase. Residual: low.

**Risk 6: Excessive retention.** Severity: low (the data is minimised, but seven years is a long time to hold contact details for unconfirmed quotes). Likelihood: medium without a purge job. Mitigation: 28-day purge of customer email and mobile on unconfirmed quotes, automated. Residual: low.

**Risk 7: Subject rights request not actionable.** Severity: medium (regulatory exposure for the retailer). Likelihood: low. Mitigation: subject-access export endpoint in the admin portal; rectification supersedes a quote rather than editing it; erasure handled with the SYSC 9 exemption explained in the response. Residual: low.

## 5. Mitigations register

The mitigations referenced above are documented at engineering-spec depth across the privacy and safety sections. The DPIA records the mitigation, the location of the documentation, and the responsible party.

| Mitigation | Documentation | Responsible |
|---|---|---|
| HMAC-signed magic-link tokens | [Tampering and replay](../safety/tampering-and-replay/) | Platform |
| Rate limits per surface | [Rate limiting](../safety/rate-limiting/) | Platform |
| Append-only audit log + S3 mirror | [Tampering and replay](../safety/tampering-and-replay/) | Platform |
| 28-day purge on unconfirmed PII | [Retention](retention/) | Platform |
| 7-year retention on confirmed records | [Retention](retention/) | Platform |
| Retailer SSO + MFA on admin portal | Implementation/for-retailers | Retailer |
| Customer-name match in magic-link body | Architecture/magic-link mechanics | Platform |
| Provider message-body redaction | [Sub-processors](sub-processors/) | Retailer (config) |
| Subject-access export endpoint | Implementation/for-retailers | Platform |
| Privacy notice with Article 13 information | Implementation/for-retailers | Retailer |

## 6. Consultation

UK GDPR Article 35(9) requires consultation with data subjects "where appropriate". For a deployment of this shape (a finite consumer-facing surface with low volumes per data subject), retailer-led usability testing with a representative sample of customers is the appropriate consultation method. The retailer documents the testing, the findings, and the resulting changes.

## 7. Sign-off and review

[Retailer to fill: name and date of DPO (or equivalent) sign-off, scheduled review date, conditions that would trigger an off-cycle review.]

The DPIA is reviewed annually, on a material change to the platform (new sub-processor, new data field, new data flow), and on a material change to the retailer's operating model.

## 8. ICO consultation

A DPIA that identifies a high residual risk that the retailer cannot mitigate must be referred to the ICO under Article 36 prior to processing. For a v1 Presenter deployment with the mitigations above, this is not anticipated; the residual risks are low to medium and are mitigated by controls within the retailer's gift. If the retailer concludes otherwise on its own analysis, the prior-consultation route is followed.
