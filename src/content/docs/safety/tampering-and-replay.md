---
title: Tampering and replay
description: HMAC signing of magic-link tokens, nonce binding, post-confirmation blocklist, and the append-only audit log that backs FCA recordkeeping.
---

Two related threats sit at the heart of any signed-link receipt flow. Tampering: an attacker modifies the URL (or the quote payload behind it) and tries to commit a different acknowledgement than the one the retailer issued. Replay: an attacker captures a valid acknowledgement and re-submits it, either to forge a second confirmation or to roll back to a state the customer had moved past.

Lending Agent Presenter addresses both with three layered controls: HMAC signing of every magic-link token, nonce binding plus a one-shot blocklist after the customer first confirms, and an append-only audit log that records every state transition with a server-assigned timestamp.

## Magic-link token format

A magic-link token is a base64url-encoded HMAC-SHA256, with `kid`-rotated keys, computed over a small fixed payload.

```
token = base64url( payload || hmac_sha256(secret[kid], payload) )
payload = {
  v:        1,            // schema version
  kid:      "k_2026q2",   // key id, rotated quarterly
  quoteId:  "<uuid v4>",  // bound to one quote
  expiry:   1715000000,   // unix seconds
  nonce:    "<32 random bytes, base64url>",
}
```

Verification is constant-time. A malformed payload, a missing `kid`, an unknown `kid`, an expired `expiry`, or a mismatched HMAC all fail with the same generic 404 page, to deny an attacker an oracle.

Keys live server-side only, in `MAGIC_LINK_SIGNING_KEYS` (a JSON map of `kid` to base64-encoded 32-byte secret). Rotation is quarterly; the previous quarter's `kid` remains valid for verification for a 90-day overlap, then is removed. Because tokens carry their own `kid`, in-flight links survive the rotation gracefully.

## Why HMAC, not asymmetric

HMAC-SHA256 is the right primitive here because there is one verifier (the server) and one issuer (the same server). There is no third party who needs to verify a token without holding the secret. JWT-style asymmetric signing adds operational complexity (key publication, JWKS rotation) without any security benefit at this scope. The token format above is roughly the shape of a JWT minus the header bloat, and the server treats it that way.

## Nonce binding and replay defence

The nonce is 32 random bytes per token, generated at issuance and stored in the quote record alongside the token's `kid`, `expiry`, and `quoteId`. On every magic-link open, the server verifies the HMAC and then verifies that the nonce in the token matches the nonce on the quote record.

Re-issuing a magic link (the "resend" path, capped at one re-send per quote) generates a fresh nonce. The previous token, even with valid HMAC and valid expiry, fails the nonce check on the next open and renders the read-only "this link has been replaced, check your inbox" page.

After the customer clicks "Confirm", three things happen atomically:

1. The acknowledgement is written to the quote record (chosen `productId`, the four boolean acknowledgements, `confirmedAt`).
2. An audit event (`quote.confirmed`) is appended to the audit log with the verbatim acknowledgement text, IP, user-agent, and the `kid`/`nonce` of the token used.
3. The token's `nonce` is added to a blocklist (`quote.confirmedNonce`).

Any further open of the same token reads `confirmedNonce` is set, the token's nonce matches, and serves a read-only "already confirmed" page that shows the customer their own acknowledgement. There is no path to a second confirmation. Replay of the confirmed token does not produce a duplicate `quote.confirmed` event.

The blocklist is a single field on the quote record, not a separate Redis set. The quote record is the natural place for the data and the natural lifetime (7 years, see [retention](../../privacy/retention/)). A separate blocklist would need its own retention scheme.

## Quote payload integrity

The token binds to a `quoteId`, not to the quote payload itself. The customer's view of the quote is fetched server-side after token verification; if the retailer later modifies the quote payload in the database (which the admin portal does not permit, but which an out-of-band Postgres update might), the customer sees the modified payload on their next open.

This is intentional. The audit log is the source of truth, not the live quote record. The `quote.created` audit event records the full payload as issued, with a SHA-256 hash. The `quote.confirmed` audit event records the payload that was on screen when the customer ticked. If the live record drifts, the audit log preserves the issued and confirmed versions in their original form, and any later defence reconstructs the customer's view from the audit log.

## Append-only audit log

The audit log is the evidence layer behind every other safety claim on this page. It is append-only at the storage layer:

- **Postgres deployment.** A dedicated `audit_events` table with `INSERT`-only grants on the application role. `UPDATE` and `DELETE` are revoked. A trigger blocks `TRUNCATE`. Daily backup to S3 with object lock (compliance mode, 7 years) creates an off-platform copy that no application bug can erase.
- **Vercel KV deployment.** Events go into a hash keyed by `quoteId` with monotonically increasing index keys (`evt:0`, `evt:1`...). A second cron-driven copy writes a daily JSONL roll-up to S3 with object lock. The KV records are the live read path; the S3 records are the durable evidence.

Each event is a small JSON document with a fixed shape:

```ts
type AuditEvent = {
  eventId:    string;          // uuid v4, server-assigned
  ts:         string;          // ISO-8601 with ms, server clock
  type:       "quote.created" | "quote.sent" | "quote.opened"
            | "quote.option-picked" | "quote.acknowledged" | "quote.confirmed"
            | "quote.expired" | "quote.failed-to-send";
  quoteId:    string;
  retailerId: string;
  actor: {
    kind:     "rep" | "customer" | "system" | "admin";
    name?:    string;          // claimed rep name, or null
    sessionId?: string;        // for admin reads
  };
  ip:         string;          // IPv4/IPv6, ::1 in dev
  ua:         string;          // truncated to 256
  payload:    Record<string, unknown>;  // event-specific
};
```

For `quote.confirmed`, `payload` includes the chosen `productId`, the four acknowledgement booleans, the verbatim text strings shown to the customer, and the SHA-256 hash of the quote payload as rendered.

## Replay support for defence

The audit log is replayable. A retailer (or the FCA on request) can reconstruct the exact view the customer saw and the exact sequence of clicks they made, from `quote.created` through `quote.confirmed`. This is the basis for the [audit as evidence](../../regulatory/audit-as-evidence/) chapter, which sets out how this replay would support a defence under s.140A unfair-relationship or a Consumer Duty enforcement question.

Because the verbatim text of the four acknowledgement statements is stored in the audit event (not just a "version: 3" pointer), a future change to the regulatory text or the UI copy does not corrupt historical records. Each historical record is self-contained.

## Time integrity

The audit log relies on server time. The Vercel platform synchronises clocks via NTP. Events carry millisecond-resolution timestamps. For a defence that turns on the order of two events seconds apart (an unusual case), the server's monotonic ordering is the authority; for ordering across server boundaries, the millisecond timestamps are sufficient at the scale the retailer operates.

A higher-assurance time anchor (RFC 3161 timestamps from a TSA, or transparency-log style anchoring) is not in scope for v1 and is not standard for the threat profile of consumer credit broking. It is documented as a possible production hardening step in the deploy section.

## What this section does not cover

This page is about evidence integrity for the customer journey. The privacy section ([retention](../../privacy/retention/)) covers how long the records are kept and on what trigger they are purged. The regulatory section ([audit as evidence](../../regulatory/audit-as-evidence/)) covers how the records would actually be used in a defence and what shape that defence takes.
