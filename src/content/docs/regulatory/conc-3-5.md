---
title: CONC 3.5 (financial promotions)
description: How the customer-facing PDF and phone receipt render APRs, total amounts payable, deferred-payment representative examples, and commission disclosure.
---

CONC 3.5 ("Financial promotions and communications with customers: credit brokers and lenders") governs the form and content of credit-broker communications. The customer-facing PDF receipt and the option-comparison grid on the customer phone surface are communications that fall within CONC 3.5's scope. This page sets out the form rules, how the platform renders figures, and the commission-disclosure posture.

## The shape of CONC 3.5

CONC 3.5 contains a number of rules; the ones that matter most for a Presenter deployment are:

- **CONC 3.5.3R** (clarity, fairness, not misleading): a financial promotion or communication must be clear, fair and not misleading. Information must be presented in a way that is likely to be understood by the average member of the group to which it is directed.
- **CONC 3.5.5R** (representative example): where a financial promotion includes an interest rate or any amount relating to the cost of credit, it must include a representative example with specific component figures.
- **CONC 3.5.7R** (representative APR triggers): where a financial promotion mentions certain triggering elements (an incentive to apply for credit, a rate of charge, the amount of any payment, or a comparison with a different rate), the representative APR must be included with equal prominence.

CONC 3.5.5R(2) sets out the components a representative example must include:

- (a) the rate of interest (and whether fixed or variable);
- (b) the nature and amount of any other charge included in the total charge for credit;
- (c) the total amount of credit;
- (d) the representative APR;
- (e) where applicable, the cash price of the goods or services and the amount of any advance payment;
- (f) the duration of the agreement;
- (g) the total amount payable;
- (h) the amount of each repayment of credit.

The representative example must be representative of agreements the firm reasonably expects at least 51% of customers entering into agreements as a result of the promotion to enter into.

## How the platform renders a representative example

The customer phone surface and the PDF preview render each finance option as a fully populated example. The figures are computed by `lib/finance-math.ts` from the per-option catalogue entry plus the customer-specific price and deposit, and rendered by the option-comparison grid (`components/customer/option-comparison-grid.tsx`).

For each option in the catalogue, the rendered example contains:

- **Rate of interest** (annual, fixed): from the catalogue entry. CONC 3.5.5R(2)(a).
- **Other charges**: a settlement-fee or arrangement-fee line item where the catalogue entry includes one. CONC 3.5.5R(2)(b).
- **Total amount of credit**: price minus deposit, computed by `finance-math.ts`. CONC 3.5.5R(2)(c).
- **Representative APR**: from the catalogue entry, rendered with the prefix "Representative APR" exactly as the FCA's guidance requires. CONC 3.5.5R(2)(d).
- **Cash price and advance payment**: the goods price and the deposit, rendered as separate line items. CONC 3.5.5R(2)(e).
- **Duration**: months, rendered as "60 months" rather than "5 years" for clarity at the unit the customer pays. CONC 3.5.5R(2)(f).
- **Total amount payable**: deposit + (monthly x term), computed and rendered prominently. CONC 3.5.5R(2)(g).
- **Each repayment**: the periodic payment, rendered to two decimal places, with the period unit ("£253.42 per month"). CONC 3.5.5R(2)(h).

Because every option is rendered side-by-side with its own complete example, the surface is not relying on the "representative" sleight of hand that lets a less-rigorous presenter show one APR and hope the customer assumes it applies to them. The customer sees a complete example for the option they are about to acknowledge, with all eight components.

## Deferred-payment options (BNPL)

The catalogues include 96-month BNPL options with a deferred-payment period (Solaris and Hayes & Sons offer 4-month and 6-month deferred variants; Bright Lane offers a 3-month deferred variant). CONC 3.5 and the related CCA representative-example rules treat deferred-payment finance specifically.

The rendering for a deferred-payment option includes:

- The deferred period made explicit ("No payments for 4 months, then 92 monthly payments of £...").
- The interest accrual posture during the deferred period made explicit (interest accrues from day one and is capitalised, or interest does not accrue, per the catalogue entry's `deferralInterest` field).
- The total amount payable computed including the deferred period's accrued interest where applicable.
- A "key feature" one-liner on the option card that warns the customer the option is BNPL with a deferred period (rendered in `components/customer/option-comparison-grid.tsx`).

This is the form CONC 3.5 expects. The customer cannot accidentally interpret "no payments for 4 months" as a discount; the deferred-period interest treatment is on the same card as the offer.

## "Subject to status" language

The phrase "subject to status" is regulatory shorthand for the lender's underwriting decision being a separate step. CONC 3.5 does not prescribe the phrase exactly, but FCA guidance and industry practice both use it. The platform renders "Subject to status" on every option card and in the PDF preview, and the fourth customer acknowledgement statement requires the customer to confirm they have understood it.

## Commission disclosure

Commission disclosure has been the subject of intense regulatory and judicial attention since the 2023 motor-finance decisions and the FCA's subsequent CP25/27 work. CONC 4.5 and CONC 4.5A set out specific disclosure obligations for credit brokers, with the practical thrust that the customer must be told the broker is paid by the lender, and where the commission would unfairly affect the customer's decision, the nature and amount of the commission.

The platform supports commission disclosure through a per-skin disclosure block configurable in `lib/skins.ts` (`footerText` already carries the broker-status statement; an additional `commissionDisclosure` field is reserved for the next iteration). The disclosure renders:

- On the customer phone surface, in the receipt footer, before the acknowledgement checklist.
- On the PDF preview, in the disclosure block immediately below the option summary.
- On the magic-link email body footer (a brief version), with a "see full receipt" link to the in-page version.

The retailer is responsible for the content of the disclosure (the specific commission structure, the lender's identity, any difference-in-charges scenarios that would qualify as unfair under the motor-finance line of reasoning). The platform renders what the retailer configures and records the rendered form in the audit log.

## Risk warnings

CONC 3.5.7R requires risk warnings for high-cost short-term credit. None of the platform's three demo skins offer high-cost short-term credit (the catalogues are all secured or unsecured term loans within standard APR ranges), so the high-cost warning rules are not engaged in the v1 demo. A retailer adopting the platform for a high-cost-short-term product would need to configure the appropriate risk warning into the option card and the PDF preview; the catalogue schema supports a `riskWarning` field for this purpose.

## Audit-log capture

The `quote.created` audit event captures the full rendered example for each option in the quote. The `quote.confirmed` event captures the option the customer picked, the verbatim text shown, and the SHA-256 hash of the quote payload. A future challenge alleging that the financial promotion was not clear, fair, and not misleading is defended by replaying the customer's view from the audit log.

The [audit as evidence](audit-as-evidence/) page sets out the defence shape in detail.

## Where this section sits

CONC 3.5 governs the form of the communication. CONC 4.2 ([CONC 4.2](conc-4-2/)) governs the substance of the explanation. The two are complementary; satisfying CONC 4.2 typically requires the figures and the example to be in the form CONC 3.5 prescribes, and satisfying CONC 3.5 sets up the customer to be able to engage with the CONC 4.2 explanation.
