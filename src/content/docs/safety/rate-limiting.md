---
title: Rate limiting
description: Concrete rate-limit ceilings for each surface, suggested storage backends, and example middleware code.
---

Rate limiting is the primary defence against URL-leak abuse, magic-link enumeration, and admin-portal scraping. Lending Agent Presenter exposes a small surface (quote-create, magic-link open, customer confirm, admin reads), and each path has a tight ceiling that fits human pace and rejects automation.

This page sets the ceilings, the recommended storage backend, and shows the middleware that enforces them.

## Ceilings

| Path | Limit | Window | Keyed on | Reason |
|---|---|---|---|---|
| `POST /api/quote` | 10 | 1 min | Signed retailer URL `kid` | Rep pace tops out at 4-5 quotes/min in store; 10 absorbs bursts and rejects scripted abuse. |
| `POST /api/quote` | 50 | 1 hour | Signed retailer URL `kid` | Daily cap on quotes per URL. Bigger retailers split URLs by site. |
| `POST /api/quote/send` | 2 | Quote lifetime | Quote ID | One initial send + one re-send. Hard stop. |
| `GET /api/customer/<token>` | 5 | 1 min | Token | Customer can re-open; bot-grade re-opens get rejected. |
| `POST /api/customer/<token>/confirm` | 3 | 1 min | Token | Genuine confirms succeed first try; retries cap at 3. |
| `GET /api/admin/*` | 30 | 1 min | Admin session ID | Human admin pace; bounds scrape behaviour. |
| `POST /api/admin/export` | 5 | 1 hour | Admin session ID | CSV exports. Bounded so a compromised session cannot exfiltrate the entire tenant in seconds. |

Limits exceed-by-one return HTTP 429 with `Retry-After` set to the window remainder. The customer surface returns a friendly "too many opens, please wait" page rather than a raw 429, because the recipient may be a non-technical user re-tapping a slow link.

## Storage backend

The limiter needs an atomic counter with a TTL. Two recommended options on Vercel:

- **[Upstash Ratelimit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)** with Upstash Redis. First-class on Vercel, serverless-friendly, sub-millisecond reads in-region. Sliding-window or fixed-window algorithms.
- **[Vercel KV](https://vercel.com/docs/storage/vercel-kv)** (Redis-backed) with a hand-rolled `INCR`-with-`EXPIRE` pattern. Slightly cheaper if KV is already provisioned for other state.

Either choice gives the same semantics. Upstash Ratelimit is the default recommendation because its API is purpose-built and avoids the race conditions that can creep into hand-rolled `INCR`+`EXPIRE` patterns.

## Example middleware

A single piece of middleware applied to the API routes. The `keyFor` function picks the right key per route. The `limitFor` function picks the right limit per route. Both are small lookup tables.

```ts
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

const limiters = {
  quoteCreate:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "rl:qc"  }),
  quoteCreateHr:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(50, "1 h"), prefix: "rl:qch" }),
  quoteSend:      new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(2,  "30 d"), prefix: "rl:qs"  }), // quote lifetime
  customerOpen:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "1 m"), prefix: "rl:co"  }),
  customerConf:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3,  "1 m"), prefix: "rl:cc"  }),
  adminRead:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:ar"  }),
  adminExport:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "1 h"), prefix: "rl:ae"  }),
} as const;

type Route = keyof typeof limiters;

function routeFor(path: string): Route | null {
  if (path === "/api/quote") return "quoteCreate";
  if (path.startsWith("/api/quote/") && path.endsWith("/send")) return "quoteSend";
  if (path.startsWith("/api/customer/") && path.endsWith("/confirm")) return "customerConf";
  if (path.startsWith("/api/customer/")) return "customerOpen";
  if (path === "/api/admin/export") return "adminExport";
  if (path.startsWith("/api/admin/")) return "adminRead";
  return null;
}

function keyFor(route: Route, req: NextRequest): string {
  switch (route) {
    case "quoteCreate":
      return req.headers.get("x-retailer-kid") ?? "unknown";
    case "quoteSend":
      return req.nextUrl.pathname.split("/")[3] ?? "unknown"; // quoteId
    case "customerOpen":
    case "customerConf":
      return req.nextUrl.pathname.split("/")[3] ?? "unknown"; // token
    case "adminRead":
    case "adminExport":
      return req.cookies.get("admin_session")?.value ?? "unknown";
  }
}

export async function middleware(req: NextRequest) {
  const route = routeFor(req.nextUrl.pathname);
  if (!route) return NextResponse.next();

  const key = keyFor(route, req);
  const { success, reset } = await limiters[route].limit(key);
  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": retryAfter.toString() },
    });
  }

  // For quoteCreate, also check the per-hour ceiling.
  if (route === "quoteCreate") {
    const hr = await limiters.quoteCreateHr.limit(key);
    if (!hr.success) {
      return new NextResponse("Hourly limit exceeded", { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/quote/:path*", "/api/customer/:path*", "/api/admin/:path*"],
};
```

## Operational notes

The limit keys deliberately avoid IP. A customer behind a carrier-grade NAT can share an IP with thousands of other phones; an IP-keyed limit on the customer surface would punish legitimate users. The token (for the customer surface) and the signed retailer URL `kid` (for the rep tablet) both bind to the right scope.

429 events are emitted as audit-log entries with the route and the keyed identifier (truncated to 12 characters). A spike in 429s on `quoteCreate` for a single `kid` is the signature of a leaked URL and should trigger URL rotation. The implementation/for-retailers section recommends a small operations dashboard tile that shows 429 rate per `kid` over the last 24 hours.

A separate global circuit breaker is not in scope. If the per-key limits are correct, the global rate is the per-key rate multiplied by the number of legitimate keys, and that scales linearly with the retailer estate. Vercel's platform-level edge protection handles the volumetric DDoS layer underneath this.
