---
title: Custom domain
description: Adding a domain in the Vercel dashboard, DNS records, HTTPS, and www-redirect.
---

The default `lending-agent-presenter.vercel.app` URL is fine for the demo. A production deployment goes on a custom domain so the rep tablet, customer phone, and admin portal carry the retailer-or-broker brand. This page walks the DNS setup.

## Pick a domain shape

Three common patterns:

| Pattern | Example | Use when |
|---|---|---|
| Apex on broker brand | `quotes.broker-domain.co.uk` | Broker is the customer-facing entity |
| Subdomain per retailer | `quotes.retailer-domain.co.uk` | Each retailer wants their own cosmetic URL |
| Single shared subdomain | `app.shermin.example` | Multi-retailer SaaS, retailers identified by signed URL path |

The third pattern is cheapest to operate. The first two are most commonly requested. You can run all three on the same Vercel project by adding multiple domains.

## Add domain in Vercel

In the Vercel project, Settings > Domains > Add.

| Step | Action |
|---|---|
| 1 | Type the domain. E.g. `quotes.broker-domain.co.uk`. |
| 2 | Vercel detects whether it's apex or subdomain. |
| 3 | Vercel shows the required DNS record. |

## DNS records

For an apex domain (`broker-domain.co.uk`):

| Record | Type | Value |
|---|---|---|
| Apex | `A` | `76.76.21.21` |

For a subdomain (`quotes.broker-domain.co.uk`):

| Record | Type | Value |
|---|---|---|
| Subdomain | `CNAME` | `cname.vercel-dns.com` |

Set in your DNS provider (Cloudflare, Route 53, etc.). DNS propagation takes anywhere from minutes to a few hours; Vercel polls and confirms once it sees the record.

## HTTPS

Vercel auto-provisions a Let's Encrypt certificate as soon as DNS resolves. No action required. Renewal is automatic. The certificate covers the apex and any subdomain you add to the same project.

If your DNS provider proxies traffic (Cloudflare orange cloud), you have two choices:

| Mode | Behaviour |
|---|---|
| Cloudflare proxy on, SSL/TLS "Full (strict)" | Cloudflare presents its own certificate; Vercel still serves a valid certificate behind. |
| Cloudflare proxy off (DNS-only, grey cloud) | Vercel handles HTTPS directly. Recommended for simplicity. |

For most production deploys, recommend grey cloud (DNS-only) so Vercel's analytics, logs, and edge logic see the original request without Cloudflare in the path.

## www redirect

The Vercel UI offers a "redirect to" option when adding a second domain. Common pattern:

| Add | Redirect to |
|---|---|
| `www.quotes.broker-domain.co.uk` | `quotes.broker-domain.co.uk` (apex of the chosen subdomain) |

Vercel issues the 308 redirect and serves the certificate for the `www` host as well.

For a marketing setup that needs `www` as the primary:

| Add | Redirect to |
|---|---|
| `broker-domain.co.uk` (apex) | `www.broker-domain.co.uk` |
| `www.broker-domain.co.uk` | (no redirect; primary) |

Pick one canonical and stick to it. Don't run both as primaries; SEO and analytics break.

## Path-based domain routing

If multiple retailers share `app.shermin.example`, the path determines the retailer. Vercel sees one domain; the Next.js app reads `retailerId` from the URL.

```
https://app.shermin.example/r/<retailerId>?sig=<HMAC>
```

This is the cheapest model. The retailer has no DNS to set up; they just bookmark the URL on their tablets.

For retailer-branded domains, each retailer adds the domain to your Vercel project. They control their DNS; you don't.

## Verifying the setup

After DNS resolves and Vercel marks the domain "valid":

1. Open `https://<domain>/`. The marketing landing should load with a green padlock.
2. Open `https://<domain>/demo/rep`. Rep tablet should load.
3. `curl -I https://<domain>/`. Confirm `HTTP/2 200` and `strict-transport-security` header.
4. `dig <domain>`. Confirm the A or CNAME record is correct.

## Multiple domains on one project

A Vercel project can hold many domains. Each can be:

| Role | Behaviour |
|---|---|
| Production primary | Default. The "production URL" the dashboard shows. |
| Production alias | Same content as primary; useful for retailer-branded subdomains. |
| Redirect target | 308s to the primary. |

For multi-retailer deployments where each retailer wants their own subdomain, add them all as production aliases. The Next.js middleware reads the host header and routes accordingly.

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const retailer = lookupRetailerByHost(host);
  if (retailer) {
    req.headers.set("x-retailer-id", retailer.id);
  }
  return NextResponse.next();
}
```

`lookupRetailerByHost` reads from a small in-memory map populated at build time, or from KV for a runtime-configurable mapping.

## Domain hygiene

| Practice | Why |
|---|---|
| One canonical primary per environment | Avoid SEO duplication, simplify analytics |
| HSTS preloading after 60 days | Force HTTPS at the browser level |
| `Content-Security-Policy` header | See [production hardening](/deploy/production-hardening/) |
| `X-Frame-Options: DENY` | Prevent the rep tablet or customer phone surface from being embedded in third-party sites |
| Audit DNS records quarterly | Catch stale CNAMEs and unused subdomains pointing at the project |

## Removing a domain

In Vercel: Settings > Domains > Remove. The DNS record at your provider becomes orphaned; remove it there too. Existing traffic to the removed domain receives a Vercel "deployment not found" page until the DNS record is removed.

If the domain is being decommissioned (retailer offboarding), follow the offboarding clause in the SaaS agreement: data export within 30 days, deletion at end of retention.
