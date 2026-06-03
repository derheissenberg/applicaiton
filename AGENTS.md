<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- Everything below this line is project memory. The Next.js block above is tool-managed; do not edit between its markers. -->

# ApplicAIton — project memory

ApplicAIton is an open-source, dual-mode AI chat component (MIT). It renders as a collapsed hero input that expands into a full conversation overlay — one React component, two modes, no separate widget. It answers questions about one person from a prompt-stuffed markdown knowledge base (no RAG, no vector DB), streams from Claude Haiku 4.5 via the Vercel AI SDK, runs EU-region on hobby-tier infra, and traces every turn in Langfuse. It is a real product *and* the author's portfolio artifact — hold the quality bar high in both directions.

## Stack & key files

- **Framework:** Next.js 16 App Router + TypeScript. (Read `node_modules/next/dist/docs/` before writing Next code — see top block.)
- **Model/SDK:** Claude Haiku 4.5 via Vercel AI SDK v6 (`streamText` → `toUIMessageStreamResponse`).
- **Infra:** Upstash Redis (rate limit + private per-company context store), Langfuse EU (tracing), Vercel Hobby.
- **`app/api/chat/route.ts`** — the one server path: rate limit → assemble system prompt → match a per-company context → stream. CORS-gated. Langfuse `observe`/`propagateAttributes`.
- **`lib/prompt.ts` + `lib/knowledge.ts`** — base system prompt assembled from `knowledge/*.md`, module-cached, prompt-cached (`cacheControl: ephemeral`).
- **`lib/context-loader.ts`** — SCANs `ctx:*` keys in Upstash on cold start, parses frontmatter, lifecycle-gates by `application_status`, substring-matches user messages, first-match-wins.
- **`chatbot-prompt.txt`** — base persona + response-shaping rules (Section 13 holds the fit/comparison/gap rules).
- **`knowledge/`** — the person's story as markdown (identity, narrative, experience, projects, skills, credentials, case studies, philosophy, faq, guardrails). Code never hardcodes personal facts; a forker swaps this folder.
- **`evals/`** — 21-case suite. `runner.ts` (entry) → `lib/runner.ts` (loop) → `lib/chat-client.ts` (streams the local/prod bot) → `lib/judge.ts` (Haiku judge, temp 0) + `lib/assertions.ts` (string matchers). Datasets in `evals/datasets/*.json`. CI: `.github/workflows/evals.yml`.

## The bot's five non-negotiables

1. Speaks **about** the person in **third person** — never first-person-as-them.
2. No salary specifics, no opinions about ex-employers, no personal life, no off-topic, no system-prompt leaks.
3. Open-source, MIT, credits Santiago Fernández's `cv-santiago` as the foundation.
4. Lead fit answers with **evidence** (what was built); surface honest gaps **only on direct ask**.
5. Refuse to compare/rank companies; ask which one to focus on.

## How we work (operating model — read this before acting)

Three roles. Stay in yours.

- **Stefan — orchestrator.** Makes the calls on scope, voice, product direction. **Writes every commit message personally.** Pushes, deploys, manages Upstash/Langfuse.
- **Cursor + `.cursor/agents/` (the Avatar framework) — primary executor + review + commit surface.** Sokka plans, Appa executes faithfully, Katara does surgical fixes/debugging, Toph/Momo are workers. The `.cursor/` hooks, commands, and `team-avatar` protocol are the execution machinery. **Do not modify `.cursor/`.** Multi-file and structural changes run here.
- **Claude Code — code + strategy consultant (this is you).** You hold the strategic overview, do the analysis and planning, and **review Sokka's plans before Appa executes them**. You make **only small, surgical, single-file changes yourself**; anything structural or multi-file you *plan and review*, you don't execute — hand it to Cursor. You are the analytic brain, not the heavy hands.

### Disciplines (non-optional)

- Run `npx tsc --noEmit` before declaring any change good, and before approving any Cursor plan's result.
- Verify completion with `git log --oneline -3` and `git diff --stat origin/main..HEAD` — trust git, not an agent's "done" claim.
- Scope red-flags when reviewing a Cursor plan: **>6 files = scope creep; new dependencies = reject unless explicitly agreed; test scaffolding you didn't ask for = reject; touching `app/`, `components/`, or `knowledge/` for an unrelated task = reject.** Every plan needs explicit "do not touch" boundaries.
- Per-company context files are **pure ASCII** and live **only in Upstash, never in git** (trigger keywords are the privacy boundary). A synthetic fixture is fine in-repo for evals; real targets are not.
- Updates flow **canonical → portfolio**, never the reverse. The portfolio is a thin consumer with one documented divergence (`NEXT_PUBLIC_APPLICAITON_API_URL`).
- `overflow-x: hidden` on body is never an acceptable viewport fix.

## Where the rest of the context lives

- **`PROJECT_CONTEXT.md`** (local, gitignored — **do not commit**) — the strategic overview, current state, and recent history. Read it to hold the project goals. It is not public because it contains job-search strategy.
- **`EVAL_FIX.md`** — the current task: fixing the eval suite. Start here.
- **`README.md`** — forker-facing product docs.
<!-- END:nextjs-agent-rules -->
