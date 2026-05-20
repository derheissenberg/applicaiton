# Projects

Side projects, ventures, and personal builds across Stefan's career. Most of these ran in parallel to employed roles — built on evenings, weekends, and the gaps between agency chapters.

The bot uses this file when someone asks "has Stefan built his own things?" or "what's OnlyPN?" or "what's the chatbot?" It also serves as evidence behind the **building from scratch** thread in `01-narrative.md`.

Three buckets: currently active, past ventures, smaller open builds.

---

## Currently active

### OnlyPN — Stream like a local

A streaming discovery app for people who live between countries. iOS and Android, both stores. Built with a co-founder in React Native, with Cursor + Claude Code in the loop, Figma MCP feeding the design system into the build, Contentful as the CMS, n8n handling automations.

The idea: digital walls — geo-blocks, regional licensing, content restrictions — shouldn't decide what culture people can access any more than physical ones should. The app helps users discover where the streaming content they want is actually available, and what's worth watching once they're there.

OnlyPN is also where Stefan tests what belongs in an AI design workflow and what doesn't. The discovery loops, the prototypes, the production build — all of it gets pushed through the same agent stack he'd want to use at a job. The lessons feed back into how he leads at DHL.

Featured on Product Hunt.

### ApplicAIton — this chatbot

A working AI artifact Stefan built to demonstrate AI product leadership through the act of building it in public. Five-day build, open-source on GitHub, MIT licensed, with credit to Santiago Fernández's cv-santiago for the inspiration.

Stack: Claude Haiku 4.5 on Vercel, Next.js, Langfuse for observability, Upstash for rate limiting, prompt-stuffed knowledge base with prompt caching, automated evals as a CI gate. Total monthly cost under €25.

The architecture is intentionally simple. The signal isn't "Stefan built an AI thing" — it's "Stefan made product judgments about what NOT to build." No vector database. No LangChain. No RAG. A 1M-context window and prompt caching beat a custom retrieval stack for an 80K-token knowledge base.

The chatbot's purpose is dual: a portfolio artifact for Stefan's job search now, and a product foundation for a possible future services-led offering for other designers and job seekers who want their own. The MVP is the artifact. The product question is parked for after launch.

---

## Past ventures

These are projects Stefan founded and ran across Germany and Ireland over the years. Five in total. Different industries, different scale, same instinct: see what's missing, build the thing, ship it, see what holds up.

### Ponyreiter — premium equestrian eCommerce

A curated eCommerce shop for high-quality riding products for ponies and their riders. Stefan founded and ran it on Shopify, handling product curation, brand, store, content, and marketing.

The shop reached five-digit annual revenue and was growing steadily before Stefan stepped back. It remains the cleanest commercial proof of his eCommerce, branding, and direct-to-consumer instincts outside of his enterprise work.

### Diggga — boarding fashion brand

A boarding fashion brand built around skating, snowboarding, and surfing culture. Shopify-based, but the venture lived as much on Instagram as it did on the store. Stefan designed t-shirts that the local skate community still wears, and sponsored regional skateboard tournaments to build the brand inside the scene rather than around it.

Diggga taught Stefan how to build a brand at the community level — sponsorships, local collaborations, designs that earned their place because the riders chose to wear them. The work that doesn't show up in case studies but shapes how Stefan thinks about brand-as-product.

### Honeyvation — habit savings concept

A product concept built around the habit of saving as a foundational practice — "the habit of saving is itself an education." Stefan developed the concept, the brand, a pitch, and a video explainer published on Pitchwall.

Honeyvation never scaled into a full venture, but the work surfaced ideas Stefan continues to apply: habit systems, daily practices that compound over time, the relationship between personal financial discipline and broader self-direction.

### Rotpäckchen — curated subscription gift shop

A subscription gift shop concept designed around sending small premium products to elderly parents — chocolate, food specialties, small thoughtful items. The idea was a curated monthly box for adult children to send their aging parents something nice and personal without having to think about it every month.

Stefan designed the brand, the model, and the curation logic. The visuals from the project currently live on an archived hard drive and aren't online.

### Smaller earlier ventures and freelance builds

The fifth venture line covers smaller earlier builds — freelance brands, micro-stores, and self-coded projects from Stefan's freelance years (2010–2018). Eight years of running an independent practice in parallel with agency work produced more than five named ventures across that time, but five is the count Stefan uses when describing his founding experience.

Beyond his own ventures, Stefan built and shipped a significant volume of client work during the freelance years — websites, WordPress sites, blogs, eCommerce stores, web apps, branding systems, campaigns, and analytics setups. Dozens of WordPress sites, builds across TYPO3 and Magento, and the full chain of design, frontend, hosting, and analytics for clients across multiple industries. The full freelance context lives in `02-experience.md` under the freelance role.

---

## Smaller open builds

Things Stefan has built that aren't ventures but are worth mentioning when the question warrants.

### Personal job scanner — n8n automation

A self-hosted n8n workflow that crawls career pages of companies Stefan cares about, filters for relevant roles, and surfaces them to a Telegram bot. Built during his current job search as an alternative to scraping LinkedIn manually.

The job scanner is itself an artifact of Stefan's interest in agentic workflows — using automation to reduce friction in his own work, then bringing those lessons into product environments at scale.

### Public writing

Stefan has documented daily ideas since 2019. Topics include entrepreneurship, independence, habit systems, design philosophy, and applied AI in design workflows. The earlier writing lives at medium.com/@derheissenberg. More recent writing is at stefanheissenberg.de.

---

## How the bot should handle this content

- When someone asks "has Stefan built his own things?" — lead with OnlyPN and the chatbot. The five past ventures support the answer; don't recite them all unless the visitor asks for depth.
- When someone asks about a specific venture by name, give that venture's section in full and offer to talk about another.
- Don't quantify ventures Stefan hasn't quantified. Ponyreiter is the only one with a public revenue number — five-digit annual revenue. The others get described by what they were, not what they earned.
- Diggga's strongest signal is the community angle — t-shirts the local skate scene wore, sponsorships, brand-at-community-level. Lead with that, not the platform.
- Honeyvation and Rotpäckchen are honest about scale. Concepts and brand work, not scaled businesses. Don't inflate.
- The chatbot's strongest signal is the *judgment* — knowing what NOT to build. Lead with that when a builder-culture or AI-fluent visitor asks.
- When someone asks about freelance work, client projects, or web/WordPress builds in volume, point to `02-experience.md` — the freelance role there is the canonical record. This file covers ventures Stefan founded, not client work he shipped.
- Never claim a project earned awards, traffic, or recognition unless it appears in this file or `05-credentials.md`.