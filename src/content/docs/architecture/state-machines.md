---
title: State machines
description: Explicit state diagrams for the rep tablet, customer phone, admin portal, and magic-link issuance.
---

Lending Agent Presenter has four small state machines, one per surface. They are kept independent so each can be reasoned about, instrumented, and tested in isolation. None of them are AI-driven.

## Rep tablet

The rep tablet is a one-page builder. It begins blank, captures the rep's name once per device, fills the form, and ends on send.

```mermaid
stateDiagram-v2
  [*] --> RepNameMissing
  RepNameMissing --> Building: rep name captured (localStorage)
  Building --> Building: input change (price, deposit, customer)
  Building --> Reviewing: every required field valid
  Reviewing --> Building: edit
  Reviewing --> SendingMagicLink: click "Send to customer"
  Reviewing --> InStoreAck: click "Customer present, ack now"
  SendingMagicLink --> Sent: API 201
  SendingMagicLink --> SendError: API 4xx/5xx
  SendError --> Reviewing: retry
  Sent --> [*]
  InStoreAck --> [*]: hands device to customer
```

| State | Persisted | Notes |
|---|---|---|
| `RepNameMissing` | localStorage `repName` | Modal blocks input until the rep types a name. |
| `Building` | Zustand store | Live finance product cards re-render on every keystroke. |
| `Reviewing` | Zustand store | Send button enabled. |
| `SendingMagicLink` | None | API call in flight. |
| `Sent` | Server | `quote-created` and `quote-sent` events appended. |
| `InStoreAck` | Zustand store | Same surface re-renders the customer view inline. |

## Customer phone

The customer arrives via magic link. The page validates the token, renders the quote, captures a pick, runs through the four acknowledgement tickboxes, and confirms.

```mermaid
stateDiagram-v2
  [*] --> Validating
  Validating --> Invalid: token invalid / expired / replayed
  Validating --> Viewing: token ok
  Invalid --> [*]
  Viewing --> Calculating: open budget calculator
  Calculating --> Viewing: close calculator
  Viewing --> Picked: tap an option
  Picked --> Viewing: change pick
  Picked --> Acknowledging: open acknowledgement checklist
  Acknowledging --> Picked: collapse checklist
  Acknowledging --> Confirming: all four boxes ticked + click confirm
  Confirming --> Acknowledged: API 200
  Confirming --> ConfirmError: API 4xx/5xx
  ConfirmError --> Acknowledging: retry
  Acknowledged --> [*]
```

The four tickboxes are the CONC 4.2 adequate-explanation acknowledgements: minimum repayment, can overpay, contact lender to apply overpayments, this is a credit agreement.

## Retailer admin

The admin portal is read-mostly. The state machine here is per-page rather than per-session: each page loads, paginates, and filters.

```mermaid
stateDiagram-v2
  [*] --> Authenticating
  Authenticating --> Unauthorised: session invalid
  Unauthorised --> [*]
  Authenticating --> Dashboard: session valid
  Dashboard --> Listing: navigate to /admin/list
  Dashboard --> QuoteDetail: click recent quote
  Listing --> Listing: filter / paginate
  Listing --> QuoteDetail: click row
  Listing --> Exporting: click "Export CSV"
  Exporting --> Listing: download done
  QuoteDetail --> Listing: back
  QuoteDetail --> Resending: click "Resend magic link"
  Resending --> QuoteDetail: API 200, new event appended
```

Resending a magic link is the only mutation an admin can make. It generates a new token (under `current` `kid`), stores its hash, and appends a `quote-sent` event. The previous hash is overwritten; the previous token becomes uncallable on next validation.

## Magic-link issuance

The signer is a small state machine of its own, called from the API route handler. It owns the keys, the nonce, and the token assembly.

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> LoadingKey: sign(quoteId, exp) requested
  LoadingKey --> Failed: kid 'current' missing or invalid
  LoadingKey --> Building: key loaded
  Building --> Building: generate 16-byte nonce
  Building --> Encoding: header + payload assembled
  Encoding --> Signing: base64url encode
  Signing --> Returning: HMAC-SHA256 over header.payload
  Returning --> Idle: token returned
  Failed --> Idle: caller handles error
```

On the validation side, the signer's complement runs the five-step check from [magic-link mechanics](/architecture/magic-link-mechanics/).

## Status-field state machine

The `QuoteStatus` field on the persisted quote row is the union of all customer-facing transitions. Audit events append for every transition; the field is the materialised view.

```mermaid
stateDiagram-v2
  [*] --> sent: quote-created + quote-sent
  sent --> opened: magic-link-clicked
  sent --> expired: TTL elapsed
  opened --> option_picked: option-picked
  option_picked --> acknowledged: acknowledgements-confirmed
  opened --> expired: TTL elapsed
  option_picked --> expired: TTL elapsed
  acknowledged --> [*]
  expired --> [*]
```

`acknowledged` and `expired` are terminal. Once a quote is acknowledged, the magic link is dead (its nonce is blocklisted). Once a quote is expired, no further events are accepted; a new quote must be issued.
