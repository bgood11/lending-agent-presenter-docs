---
title: Production hardening
description: Pre-launch checklist covering rate limits, secrets, retention, CSP, error monitoring, and uptime.
---

The demo is a portfolio piece. Production is a regulated SaaS handling pre-contractual finance disclosures for real customers. This page is the checklist between the two: what to lock down before the first real customer sees the surface.

## Pre-launch checklist

| Area | Check | Done when |
|---|---|---|
| Rate limits | Per-resource KV counters live | 10 quote-creates/min per signed URL, 5 magic-link opens/min per token, 30 admin reads/min per session, all enforced |
| Magic-link signing | Real keys deployed, rotation cadence documented | `MAGIC_LINK_SIGNING_KEY_CURRENT` is 32+ random bytes; rotation runbook exists |
| Token TTL | `MAGIC_LINK_TTL_HOURS` set | Default 336 (14 days). Approved by broker compliance. |
| Env vars | All secrets live in Vercel, none in source | `git grep` for known secret prefixes returns clean |
| HTTPS | Domain serves valid certificate | `curl -I` shows 200 and HSTS header |
| HSTS preload | Submitted to hstspreload.org | Site appears in the HSTS preload list |
| CSP | Content-Security-Policy header set | See below |
| Other headers | `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` | All present |
| Database | Postgres in UK region, backups on | Daily backups, 30-day retention |
| KV | UK region | KV instance in `lhr1` |
| Email | Postmark domain verified, SPF/DKIM/DMARC | DMARC at `p=quarantine` minimum |
| Audit log retention | 7 years on acknowledged, 24 months on others | Retention sweep job scheduled |
| RBAC | Admin / auditor / read-only roles enforced | Test plan confirms each role's scope |
| DSAR endpoint | Admin /admin/dsar live and tested | One end-to-end DSAR completed in staging |
| Error monitoring | Vercel + Sentry | Sentry catches client and server errors with source maps |
| Uptime monitoring | Status page + alerting | External monitor pings the customer phone surface every 60s |
| Logs | Structured logs to Logflare or Axiom | 30-day retention minimum |
| Alerting | On-call rotation set | PagerDuty or Opsgenie wired to Sentry and the uptime monitor |
| Pen test | Annual external test booked | Scope agreed and signed |
| Backup restore | Tested in staging | One full restore-from-backup performed end-to-end |

## Rate limits

Three resource ceilings, enforced at the API edge via Vercel KV counters.

| Resource | Limit | Window | KV key |
|---|---|---|---|
| Quote create | 10 | 60s | `rl:create:<retailerId>` |
| Magic link open | 5 | 60s | `rl:open:<tokenHash>` |
| Admin read | 30 | 60s | `rl:admin:<sessionId>` |

```typescript
async function rateLimit(key: string, max: number, windowSec: number) {
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, windowSec);
  if (count > max) {
    throw new HttpError(429, "rate-limited");
  }
}
```

Exceeding a limit returns 429 with a `Retry-After: 60` header. The customer-facing 429 redirects to a polite "try again in a minute" page.

## Content-Security-Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'sha256-<computed>';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://vitals.vercel-insights.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

Notes:

- `unsafe-inline` on styles is required for Tailwind's runtime utilities. Acceptable.
- `script-src` is `'self'` plus a hash for any inline `<script>` tags Next.js emits. Compute with the build.
- `frame-ancestors 'none'` prevents the surface being iframed elsewhere. Combine with `X-Frame-Options: DENY` for older browsers.
- `connect-src` allows Vercel Web Vitals telemetry. Add additional origins (Sentry, Postmark webhooks, etc.) explicitly.

## Other security headers

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

Set in `next.config.ts`:

```typescript
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

export default {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
```

## Secrets management

| Practice | Implementation |
|---|---|
| Secrets only in Vercel env vars | Never in source. `.env.local` gitignored. |
| Rotation cadence | Magic-link keys quarterly; webhook secrets annually; Postmark token annually |
| On staff exit | Rotate every secret the leaver had access to within 24 hours |
| Audit access | Vercel project access reviewed quarterly; remove unused team members |
| Break-glass account | One root-equivalent account, password in a sealed vault, used for emergency only |

## Retention enforcement

A nightly cron job runs the retention sweep:

```typescript
// app/api/cron/retention-sweep/route.ts
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("unauthorized", { status: 401 });
  }
  await sweepExpiredQuotes();      // unacknowledged > 24 months
  await purgeOldWebhookDeliveries(); // > 90 days
  await purgeOldNonces();           // KV TTL handles this; sweep is a safety net
  return new Response("ok");
}
```

Configure in `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/retention-sweep", "schedule": "0 2 * * *" }]
}
```

The sweep emits a `retention-sweep-run` log entry with counts. Two consecutive failures page the on-call.

## Error monitoring

Sentry for the application, Vercel's built-in observability for the platform.

| What | Where |
|---|---|
| Unhandled exceptions | Sentry |
| Failed token validation | Logged at WARN, not paged unless rate exceeds threshold |
| Failed webhook deliveries | Logged + visible in admin portal "delivery health" panel |
| 5xx rate | Vercel + Sentry, page on > 1% over 5 minutes |
| p95 page load | Vercel Web Vitals, page on > 3s sustained |

## Uptime monitoring

External pings every 60 seconds:

| Endpoint | Expected | If failing |
|---|---|---|
| `GET /` | 200, "Lending Agent Presenter" in HTML | Page on-call |
| `GET /api/health` | 200, `{"ok": true}` | Page on-call |

`/api/health` checks: server alive, Postgres reachable, KV reachable, signing key loadable. Simple boolean.

## Backups

| What | Frequency | Retention |
|---|---|---|
| Postgres | Daily snapshot, point-in-time recovery enabled | 30 days |
| Vercel Blob (PDFs) | Versioned by Vercel by default | Lifetime of the parent quote (7 years) |
| KV | Volatile by design; nonce blocklist tolerable to lose | None |
| Source | GitHub | Forever |

A full restore drill is run twice a year. Documented in the runbook; on-call rotates through it.

## Incident response

| Severity | Definition | Response |
|---|---|---|
| P1 | Customer cannot acknowledge OR data breach | Page on-call. 15 minute response. Status page update. |
| P2 | Rep cannot send a quote | Page on-call. 1 hour response. |
| P3 | Admin portal degraded | Ticket. Next business day. |
| P4 | Cosmetic or non-blocking | Backlog. |

P1 with data breach triggers UK GDPR notification chain: Shermin → broker (controller) within 24 hours → ICO + customers per Article 33/34, within 72 hours of becoming aware.

## Final pre-launch test

A short list, run in staging the week before launch:

1. Build a quote on the rep tablet. Confirm the email arrives at a real address.
2. Click the magic link. Confirm the customer surface loads, validates the token, and renders the quote.
3. Pick an option, tick all four boxes, confirm. Confirm the audit events appear in the admin portal.
4. Open the admin portal. Run a CSV export. Open a quote detail. Resend the magic link. Confirm new audit event.
5. Force a token expiry by waiting (or shortening TTL temporarily). Confirm the expiry page renders.
6. Force a rate limit by hammering the open endpoint. Confirm 429 with `Retry-After`.
7. Confirm CSP and security headers via `curl -I`.
8. Confirm Sentry catches a deliberate test exception.
9. Confirm the retention sweep ran in staging (log entry visible).
10. Confirm the on-call rotation receives a test page from the uptime monitor.

When all ten pass, the surface is ready.
