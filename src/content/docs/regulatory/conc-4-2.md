---
title: CONC 4.2 (adequate explanations)
description: The central regulatory anchor for the platform. CONC 4.2.5R obligations and how each of the four customer acknowledgement statements maps to specific sub-rules.
---

CONC 4.2 ("Pre-contractual requirements") is the central regulatory anchor for Lending Agent Presenter. The chapter sits in the FCA's Consumer Credit sourcebook and sets out the firm's obligation, before a regulated credit agreement is made, to give the customer adequate explanations of specified matters in a manner that puts the customer in a position to assess whether the agreement is adapted to their needs and financial situation.

The four customer acknowledgement statements rendered verbatim by `components/customer/acknowledgement-checklist.tsx`, ticked individually by the customer on the customer phone surface, and recorded verbatim in the `quote.confirmed` audit event, are the platform's response to CONC 4.2.5R. This page sets out the obligation, the specific sub-rules each statement addresses, and the evidential shape of the resulting record.

## The obligation: CONC 4.2.5R

CONC 4.2.5R is the rule that bites. In substance:

> A firm must, before a regulated credit agreement is made, provide the customer with an adequate explanation of the matters referred to in (2) in order to place the customer in a position to assess whether the agreement is adapted to the customer's needs and financial situation.

The "matters referred to in (2)" are set out at CONC 4.2.5R(2)(a) to (e):

- (a) the features of the agreement which may make the credit unsuitable for particular types of use;
- (b) how much the customer will have to pay periodically and, where the amount can be determined, in total under the agreement;
- (c) the features of the agreement which may operate in a manner which would have a significant adverse effect on the customer in a way which the customer is unlikely to foresee;
- (d) the principal consequences for the customer arising from a failure to make payments under the agreement at the times required by the agreement including, where applicable and depending on the type and amount of credit and the circumstances of the customer, legal proceedings, repossession of the customer's home or other property and, where the seriousness of the consequences is likely to require it, that the customer could be made bankrupt;
- (e) the effect of the exercise of any right to withdraw from the agreement and how and when this right may be exercised.

CONC 4.2.5R(3) requires the firm to advise the customer to consider the information provided in (2) and the pre-contract credit information (the SECCI), and where it is disclosed in person, to take it away.

CONC 4.2.5R(4) requires the firm to advise the customer how to ask the firm for further information and explanation, and to give that information and explanation if asked.

CONC 4.2.5R(5) requires the firm, when giving the explanation, to provide it in a way appropriate to the means by which the agreement is to be entered into, and the customer's understanding.

The chapter sits in the context of CONC 4.2.4G (purpose), CONC 4.2.10R to 4.2.16R (specific guidance for credit brokers and other parties), and the cross-cutting Consumer Duty obligations (PRIN 2A.5 on consumer understanding, in particular).

## The four acknowledgement statements

Each of the four statements ticked on the customer phone surface maps to one or more of the (2) matters. The statements are reproduced verbatim from `components/customer/acknowledgement-checklist.tsx`:

### Statement 1: "I understand I must make the minimum repayment each month."

**Maps to:** CONC 4.2.5R(2)(b) (how much the customer will have to pay periodically) and CONC 4.2.5R(2)(d) (consequences of failure to pay).

This is the affordability anchor. The customer confirms they have read the periodic payment figure on the receipt and understand it as a recurring obligation. The customer phone surface displays the periodic payment prominently in the receipt header, in the budget calculator, and in the PDF preview. The audit log records the chosen `productId`, which keys to the per-month figure rendered.

### Statement 2: "I understand I can make overpayments at any time, which could reduce my interest."

**Maps to:** CONC 4.2.5R(2)(b) (total payable, by reference to the option of paying earlier) and CONC 4.2.5R(2)(e) (effect of exercising rights under the agreement). This statement covers the customer's positive option to overpay; the negative-overpayment-effect (settlement charges) is addressed in the SECCI rendered as part of the PDF preview.

The customer is on notice that overpayment is available and that it bears on the total interest paid. The platform does not perform the overpayment maths in the demo; production-grade settlement-figure calculation is the lender's domain.

### Statement 3: "If I want to overpay, I understand I should contact the lender directly to apply it correctly."

**Maps to:** CONC 4.2.5R(4) (firm to advise the customer how to ask for further information). The customer is on notice that the operative party for overpayment is the lender, not the retailer/broker. This addresses a common point of customer confusion at point-of-sale finance, where the customer assumes the retailer they paid is the entity to call later.

The retailer's PDF receipt includes the lender's contact details in the disclosure block; this acknowledgement statement is the customer's confirmation that they have noted them.

### Statement 4: "I understand the option I've picked is a regulated credit agreement, subject to status."

**Maps to:** CONC 4.2.5R(2)(a) (features that may make the credit unsuitable) and the broader CCA s.55 disclosure framework. "Subject to status" is the standard regulatory shorthand for the lender's underwriting decision being a separate step. The customer is on notice that the option they have picked at point of sale is conditional on the lender's affordability and creditworthiness assessment.

This statement is also the bridge to CONC 5.2A (creditworthiness assessment), which is the lender's obligation. The retailer's pre-contract presentment is gated on the customer understanding that approval is not automatic.

## What the platform does not claim to satisfy

CONC 4.2 is broader than the four statements. The chapter contemplates a fuller pre-contract conversation and the SECCI document. The platform contributes:

- The four acknowledgement statements (this page).
- The SECCI rendered as part of the PDF preview, with the customer's confirmation that they have viewed it.
- The audit-log evidence that both occurred.

It does not contribute:

- The wider conversation between rep and customer at point of sale. That is the rep's responsibility, training is the retailer's responsibility, and Consumer Duty's wider expectations bind the retailer to ensure the conversation is competent.
- The features-and-risks language tailored to particular credit-agreement types where CONC 4.2.10G to 4.2.16R impose additional matter-specific requirements (for example, the additional explanations for hire-purchase agreements). The retailer's catalogue configuration determines which products are offered, and the retailer is responsible for any product-specific add-on language; the platform supports this with per-product disclosure blocks in the catalogue definition.

## Evidential shape of the audit-log record

The `quote.confirmed` audit event records:

```ts
{
  eventId:    "<uuid v4>",
  ts:         "2026-05-08T14:32:18.123Z",
  type:       "quote.confirmed",
  quoteId:    "<uuid v4>",
  retailerId: "solaris",
  actor: {
    kind:     "customer",
  },
  ip:         "<customer ip>",
  ua:         "<customer user-agent, truncated>",
  payload: {
    pickedProductId: "monthly-60m",
    acknowledgements: {
      minimumRepayment: true,
      canOverpay:       true,
      contactLender:    true,
      creditAgreement:  true,
    },
    statements: [
      "I understand I must make the minimum repayment each month",
      "I understand I can make overpayments at any time, which could reduce my interest",
      "If I want to overpay, I understand I should contact the lender directly to apply it correctly",
      "I understand the option I've picked is a regulated credit agreement, subject to status",
    ],
    quotePayloadHash: "<sha-256 of canonical quote json>",
    tokenKid:         "k_2026q2",
    tokenNonce:       "<base64url 32 bytes>",
  },
}
```

Three properties make this record evidentially robust:

- **Verbatim text in `statements`.** A future change to the regulatory wording or the UI copy does not corrupt historical records. The text is what was on screen when the customer ticked.
- **`quotePayloadHash` ties the acknowledgement to the quote payload as rendered.** A defence reconstruction can verify the customer saw the figures the audit log claims they saw; tampering with the live quote record after the fact does not change what the customer acknowledged.
- **Token `kid` and `nonce` tie the record to the magic-link token that was used.** Replay defence (see [tampering and replay](../safety/tampering-and-replay/)) and key-rotation history (the `kid` resolves to a specific signing-key generation) are both supported.

## Defence shape under CONC 4.2

A future challenge ("the customer was not given an adequate explanation") is defended by replaying the audit log. The retailer (or the platform on the retailer's instruction) reconstructs the customer's view from the `quote.created` payload, the `quote.opened` event, the `quote.confirmed` event, and the verbatim statements. The reconstruction shows what the customer saw, when they saw it, what they ticked, and the IP/user-agent of the device on which they ticked. The hash chain ties the live quote record to the rendered view; a divergence between the two is evidence of tampering and is detected at replay time.

The [audit as evidence](audit-as-evidence/) page sets out the defence in greater detail and shows how it would be assembled in response to a regulator's information request.
