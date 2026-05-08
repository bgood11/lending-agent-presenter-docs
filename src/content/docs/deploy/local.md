---
title: Local development
description: Setup, environment variables, and local URLs for the demo and the planned production build.
---

The demo runs entirely in the browser. No backend, no environment variables, no external services. The production build adds a server layer; the env-var table below names what it needs.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22.x | Matches the Vercel runtime. |
| pnpm | 10.x | The repo uses pnpm workspaces. |
| Git | Any recent | For cloning. |

Install pnpm if you do not have it:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Clone and install

```bash
git clone https://github.com/bgood11/lending-agent-presenter.git
cd lending-agent-presenter
pnpm install
```

## Run the demo

```bash
pnpm dev
```

Next.js boots on port 3000. Open the surfaces:

| Surface | URL |
|---|---|
| Marketing landing | <http://localhost:3000> |
| Rep tablet | <http://localhost:3000/demo/rep> |
| Customer phone | <http://localhost:3000/demo/customer/demo-token> |
| Admin dashboard | <http://localhost:3000/demo/admin> |
| Admin quote list | <http://localhost:3000/demo/admin/list> |
| Admin quote detail | <http://localhost:3000/demo/admin/quote/solaris-001> |

The token slot in `/demo/customer/[token]` accepts any string; the demo does not validate.

The skin switcher (top-right in free-explore mode) writes `?skin=solaris|hayes|bright-lane` to the URL and persists in localStorage.

## Build and preview production

```bash
pnpm build
pnpm start
```

Same routes, optimised bundle. The production build of the demo is what gets deployed to Vercel.

## Environment variables

The v1 demo requires no environment variables. Everything is in-bundle.

The planned production build adds the variables below. Names are conventional; any production deploy can substitute its own naming as long as the consuming code is updated to match.

| Var | Surface | Notes |
|---|---|---|
| `DATABASE_URL` | Server | Postgres connection string (Neon or Vercel Postgres) |
| `KV_REST_API_URL` | Server | Vercel KV REST endpoint |
| `KV_REST_API_TOKEN` | Server | Vercel KV token |
| `MAGIC_LINK_SIGNING_KEY_CURRENT` | Server | base64 of 32 random bytes |
| `MAGIC_LINK_KID_CURRENT` | Server | E.g. `2026-q2` |
| `MAGIC_LINK_SIGNING_KEY_PREVIOUS` | Server | Previous key for rotation overlap |
| `MAGIC_LINK_KID_PREVIOUS` | Server | Previous kid |
| `MAGIC_LINK_TTL_HOURS` | Server | Default `336` (14 days) |
| `MAGIC_LINK_BASE_URL` | Server | E.g. `https://app.example.com/c/` |
| `POSTMARK_SERVER_TOKEN` | Server | Email send |
| `POSTMARK_FROM_EMAIL` | Server | E.g. `quotes@example.com` |
| `BLOB_READ_WRITE_TOKEN` | Server | Vercel Blob for PDF storage |
| `WEBHOOK_SIGNING_SECRET` | Server | HMAC signing for outgoing audit-event webhooks |
| `AUTH_SECRET` | Server | Auth.js session secret |
| `AUTH_URL` | Server | Auth.js canonical URL |
| `NEXT_PUBLIC_VERCEL_URL` | Client + server | Auto-set by Vercel; useful in local dev too |

Generate a magic-link key:

```bash
openssl rand -base64 32
```

Place env vars in `.env.local` for local development. `.env.local` is gitignored.

## Common dev tasks

| Task | Command |
|---|---|
| Type-check the repo | `pnpm tsc --noEmit` |
| Lint | `pnpm lint` |
| Format | `pnpm fmt` (if configured) |
| Run a single page in isolation | Use `next dev` with `--turbo` for fastest reloads |
| Reset the demo state | Clear localStorage in DevTools (`localStorage.clear()`) |

## Resetting the walkthrough

The scripted walkthrough state is intentionally not persisted: every fresh tab starts at step 0 of the marketing surface. To reset mid-session, click the "Restart walkthrough" link in the footer or run:

```javascript
useDemoStore.getState().resetWalkthrough();
```

in the browser DevTools console.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Geist font not loading | `next/font/google` requires network access on first build. Disable proxy and rebuild. |
| Skin switcher not visible | You are in scripted mode. Click "Skip walkthrough" to enter free-explore. |
| Customer phone shows skin's `defaultScenario` instead of the in-flight quote | localStorage was cleared between rep and customer surfaces. Refresh the rep tablet, click Send again. |
| Admin portal shows zero quotes | Skin in URL/state does not match the skin whose fixtures you expect. Switch skin in top-right. |
