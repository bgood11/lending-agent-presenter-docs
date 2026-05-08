---
title: Safety overview
description: Posture statement for the Lending Agent Presenter, scoping the threats that apply to a non-AI menu-style finance presentment surface.
---

Lending Agent Presenter is a menu-style finance presentment tool. A sales rep enters goods, price, deposit, and customer contact details on a tablet at point of sale. Every contracted finance option in the retailer's catalogue renders side-by-side. The customer receives a magic link, opens the receipt on their own phone, picks an option, ticks four acknowledgement statements, and confirms. The retailer reviews the audit trail in an admin portal afterwards.

The product is non-agentic. There is no language model, no autonomy, no generated prose, no tool calls. Every figure on the rep tablet and every figure on the customer phone comes from a deterministic finance-math library applied to a static product catalogue. Every disclosure shown to the customer is template text in source. The system has no decision authority of its own; the retailer holds the FCA credit-broking permission, and the lender makes the credit decision after the customer confirms.

That architecture removes a large category of safety questions. Prompt injection, hallucination, empty-turn protection, model overreliance, and tool-misuse risks do not apply here because none of the components capable of producing those failure modes are in the system. The remaining safety surface is conventional and well-understood. It comes from the four user-facing surfaces (rep tablet, customer phone, retailer admin, magic-link issuance), the trust placed in a signed retailer URL, and the data the surfaces handle.

## What this section covers

The threats relevant to Lending Agent Presenter are the threats relevant to any tool that issues a customer-facing link, accepts an acknowledgement on the customer's own device, and stores an evidential audit trail. They are:

- **URL leak and scraping.** The signed retailer URL that opens the rep tablet has no per-rep authentication. An exposed URL can be opened by anyone. Quote-creation attempts can be enumerated. The [threat model](../threat-model/) details the surfaces and the [rate-limiting](../rate-limiting/) page sets concrete ceilings to keep enumeration uneconomic.
- **Magic-link abuse.** A magic-link token issued to a customer can be opened multiple times before the customer acknowledges, can be forwarded by mistake, and can be replayed. The [tampering and replay](../tampering-and-replay/) page specifies HMAC signing, nonce binding, and the post-acknowledgement blocklist.
- **Pressure on the customer.** A finance presentment surface sits exactly where a customer is most prone to time pressure and rep-led nudging. The [vulnerable customer protection](../vulnerable-customer-protection/) page explains the design choices that take pressure out of the surface, in line with FCA FG21/1.
- **Tampering and replay.** Quote payloads, customer acknowledgements, and audit events all need to be tamper-evident and replay-resistant. The [tampering and replay](../tampering-and-replay/) page covers the HMAC scheme, the append-only audit log, and the retention policy that preserves the evidence for as long as the FCA expects retailers to keep it.
- **Social engineering of the rep.** A rep is not authenticated. Anyone in possession of a retailer URL can pose as a rep to any browser. The [threat model](../threat-model/) treats this as the dominant residual risk and sets out the per-retailer URL rotation policy that bounds it.

## What is intentionally not in scope here

Several categories of threat that would dominate the safety chapter of an AI-mediated tool are absent. There is no model to inject into. There is no chain-of-thought to manipulate. There is no generated disclosure to hallucinate. There is no autonomous tool to misuse. The four customer acknowledgement statements are static strings rendered verbatim by the UI from `components/customer/acknowledgement-checklist.tsx`; they cannot drift from the regulatory text, because nothing in the system has the power to drift them.

Network and infrastructure threats (TLS termination, DDoS at edge, Vercel platform compromise) sit outside this section. They are inherited from the deployment platform and from standard web-application hygiene. The threat model page calls out where the boundary sits.

## How a reviewer should read this section

Start with the [threat model](../threat-model/) for the STRIDE-style decomposition by surface and the trust-boundary diagram. Move to [rate-limiting](../rate-limiting/) for the concrete ceilings and the example middleware. Read [tampering and replay](../tampering-and-replay/) for the magic-link signing scheme and the audit-log integrity story. Close with [vulnerable customer protection](../vulnerable-customer-protection/) for the FG21/1 mapping and the design choices that flow from it.

The intended outcome is that a reviewer can answer, with reference to specific files, who can call what, what happens to a leaked URL, what happens to a replayed token, and what evidence survives in the audit log to defend a future enforcement question.
