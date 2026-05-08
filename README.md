# Lending Agent Presenter — docs

Starlight (Astro) docs site for [bgood11/lending-agent-presenter](https://github.com/bgood11/lending-agent-presenter). Implementation, architecture, safety, privacy, and regulatory guidance for the menu-style finance presentment demo.

Live: <https://lending-agent-presenter-docs.vercel.app>

## Sibling site

The waterfall sibling, [Lending Agent](https://github.com/bgood11/lending-agent), has its own docs site at [bgood11/lending-agent-docs](https://github.com/bgood11/lending-agent-docs). This site mirrors that site's structure (Introduction / Product / Architecture / Implementation / Safety / Privacy / Regulatory / Deploy / Reference) so the family is easy to navigate.

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:4321>.

## Build

```bash
pnpm build
pnpm preview
```

## Conventions

- Mermaid diagrams render inline via a CDN module script with light/dark theme switching.
- Theme: amber/slate, mirrored from `lending-agent-docs`.
- Edit links route to `bgood11/lending-agent-presenter-docs/edit/main/`.
