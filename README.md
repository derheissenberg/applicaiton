# ApplicAIton

An open-source, dual-mode AI chat component you can drop into any site and point at your own story. It renders as a collapsed hero input that expands into a full conversation overlay — one React component, two modes, no separate widget. EU-region by default, runs on hobby-tier infrastructure, MIT licensed.

**Live demo:** https://applicaiton.vercel.app

Built on the foundation of **Santiago Fernández's `cv-santiago`** — the dual-mode chat idea and the thin-embed pattern started there. Forked forward, themed, and extended.

## What's in here

- **Dual-mode chat** — one component: a collapsed hero input, and the full conversation overlay it expands into. The component owns its own embedding (scroll lock, focus, close); host pages only control layout.
- **A theme system** — visual identity lives entirely in CSS custom properties. Change one `data-theme` attribute and the whole page recolors, the chat included (see [Theming](#theming)).
- **A per-company context loader** — private calibration files in Upstash, matched by keyword and lifecycle-gated. Your targeting never lives in git.
- **A prompt-stuffed knowledge base** — markdown files, cached, no RAG and no vector database. The whole story fits in the context window.
- **A thin embed** — the host page is three lines.

## How it works

A single request, server-side: rate limit (Upstash sliding window per IP) → assemble the system prompt from the knowledge base → match a per-company context file if a keyword fires → stream the response from Claude Haiku 4.5 via the Vercel AI SDK. Every turn is traced in Langfuse (EU region). No vector database, no retrieval step.

## Getting started

```bash
git clone https://github.com/derheissenberg/applicaiton
cd applicaiton
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `app/page.tsx` to change the demo page.

### Environment

Set these in `.env.local` — see `.env.example` for the full list:

- `ANTHROPIC_API_KEY`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- your Langfuse keys

> **Do not wrap values in quotes.** Next.js treats the quotes as part of the value, and several of these dependencies fail open silently when that happens.

## Embedding

The host page controls only layout; the component brings everything else.

```tsx
import { Chat } from "@/components/chat/Chat";

<section style={{ ["--chat-hero-min-height-desktop"]: "100dvh" }}>
  <Chat theme="dark-tokyo" />
</section>
```

## Theming

Visual identity is CSS custom properties — no hardcoded colors, and no theme branching in component code.

- **Hero height is set by the host page, not by themes.** Pass `--chat-hero-min-height-desktop` on a parent element via inline style or CSS. The default is auto (content-fit). Mobile hero height stays theme-controlled via `--chat-hero-min-height-mobile` (default `100dvh`).
- **The chat ships two identities** — `dark-tokyo` (the demo default) and `stefan-portfolio`. Select one with the `theme` prop.
- **Page-wide theming** — a shared color-token contract lives on a `data-theme` wrapper around the page. Change that one attribute and the whole surface recolors: the chat hero and everything around it move together. The chat's color tokens reference the shared variables with built-in fallbacks, so a bare `<Chat />` with no wrapper still renders correctly on its own defaults. Define your own palette by adding a `[data-theme="your-name"]` block of variables.

## Knowledge base

The bot's knowledge is plain markdown in `/knowledge` (~25K tokens, prompt-stuffed with caching). Replace those files with your own and the bot answers from your story. The code never hardcodes personal facts — you swap the folder, not the source.

## Per-company context (optional)

Beyond the base knowledge, you can write per-target calibration files stored in Upstash under `ctx:*` keys. On cold start the loader scans them, parses their frontmatter, drops anything not marked active, and substring-matches incoming messages against their keywords; the first match is appended to the system prompt for that conversation and the behavior shift is silent. Targets are never discoverable from the repo — the trigger keyword is the only boundary. The authoring method is documented as a skill so you can write your own without leaking who you're writing them for.

## Evals & CI

A suite of 21 cases across six areas — boundary testing, company context, factual accuracy, persona adherence, response quality, and safety/jailbreak — runs as a CI gate on every push. The bot speaks about its subject in the third person and refuses salary specifics, opinions on former employers, personal-life questions, and prompt-leak attempts.

## Cost

Runs on Vercel Hobby, the Upstash free tier, Langfuse Hobby, and a Haiku-class model — roughly €0–8/month at demo volume.

## Credits

Built on the foundation of Santiago Fernández's `cv-santiago`. The dual-mode chat idea and the thin-embed pattern started there; the lineage is the point, not a footnote.

## License

MIT. Fork freely, make it yours.

## Deploy

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.