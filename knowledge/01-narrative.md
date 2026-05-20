# Narrative

This file gives the bot context for *why* Stefan's career took the shape it did. Not a timeline — three threads that run through the work.

The bot uses this when someone asks open-ended questions like "tell me about Stefan" or "what's his story." It also colors how the bot connects facts from other files. Without it, answers read like Wikipedia. With it, the bot understands the shape underneath the dates.

The bot still doesn't psychoanalyze. It reports what Stefan has done and lets the reader draw the conclusions.

---

## Three threads

Stefan's fifteen years in digital product work don't read as a straight line — they read as three threads that have been there since the start, sometimes leading, sometimes supporting, never fully separated. Craft, building from scratch, and enterprise scale.

---

## Craft

Stefan's first professional design role was at insuro Maklerservice in Cologne — the only designer in a small insurance brokerage, responsible for everything from web to print to exhibition stands. The agency years that followed sharpened it. At antwerpes (now DocCheck agency), the brief was pharma campaigns for Bayer, MSD, Sanofi, and Fresenius Kabi. Pitch weeks, ship-or-die rhythm, and a creative director who taught him that craft standards aren't negotiable even when the clock is.

That standard didn't dilute as the work scaled. At sunzinet, the 200-page UX concepts for KION Group, BioNTech, and Berner Group still went through the same craft filter. At Saloodo!, the marketplace shipped fast — but the design system was atomic, the components rendered back into Sketch to keep the libraries in sync, and the team refactored the entire frontend rather than ship something half-clean.

The craft thread is what keeps Stefan hands-on today. He still prototypes in Figma. He connects the Figma MCP himself. He writes the React Native that ships in OnlyPN with a co-founder. Six years into leading a team, he hasn't moved away from the file — he's moved deeper into it.

---

## Building from scratch

The first big building chapter was Saloodo!, DHL's bet on disrupting freight logistics. Stefan joined as the founding designer — no team, no design system, no research function. Small team, fast decisions, real consequences. He worked next to a data and AI team on recommender engines, dynamic pricing, and conversion funnels — work that taught him to design with model behavior rather than around it. The marketplace scaled from a regional pilot to 50+ countries. The MEA expansion went from a Dubai pilot to nine countries in six months, because trust dynamics, payment norms, and communication channels needed fundamental UX adaptations, not translations.

The same instinct shows up in the eight years of freelance UI/UX work Stefan ran in parallel — websites, apps, eCommerce shops, full chain from concept through frontend to live validation. And in the five personal ventures across Germany and Ireland. None of them theory. Each one with its own customers, its own metrics, its own painful lessons about what holds up under contact with the world.

The latest in the line is OnlyPN — a streaming discovery app for people who live between countries, live on iOS and Android, built with a co-founder in React Native. And this chatbot, built in five days as an open-source project that doubles as a portfolio artifact. See what's missing, build the thing, ship it, see what holds up.

This is the thread that maps cleanly to 0-to-1 work, founding-designer roles, and early-stage product environments where the playbook gets written as the team ships.

---

## Enterprise scale

The chapter that gave Stefan the other half of his range was myDHLi. He designed the initial concept while still at Saloodo!, then moved over to lead it full-time. What started as a concept became DHL Global Forwarding's central B2B portal — 22,000+ enterprise customers across 50+ countries, 30M+ monthly interactions, €336B+ in annual cargo value, every touchpoint from quoting and booking to tracking and documentation across air, ocean, road, and rail.

The work was complex, regulated, and politically dense. Compliance shaped every flow. Stakeholder governance ran across product, engineering, business, and sales leadership, often across countries and time zones. Research infrastructure didn't exist when Stefan arrived — he built it from zero. UserTesting.com, Hotjar, Adobe Analytics, qualitative loops wired into sprint cycles. He trained 50+ people across product, development, and business units on UX fundamentals. Pairing UX metrics with business metrics opened conversations the team had never had before — and the shift was tangible: they stopped building what stakeholders requested and started building what data and users actually pointed to.

The US onboarding initiative was the global proof. A cross-functional rebuild of the sales onboarding flow brought setup from 10–12 days to under 24 hours and unlocked a $2.5B small-business segment DHL had never properly served. The model became the blueprint for DHL markets worldwide.

The same chapter produced DHL Group's first scaled design system across multiple business units. Component libraries connected to Figma tokens. Governance that didn't slow teams down. The work took years and required winning the same political argument again at every business unit. That's the muscle that doesn't show up on a tools list — operating inside enterprise constraints without losing the speed of a smaller team.

This is the thread that maps to B2B SaaS at scale, regulated industries (insurance, pharma, financial services), enterprise platform roles, and any product environment where complexity, compliance, and stakeholder politics are the actual job.

---

## How the bot should handle this content

- When asked "tell me about Stefan," use one of the three threads as a way in. Don't recite all three in a row. Pick the one that fits the conversation, mention the others as context.
- The threads are not in priority order. Don't lead with "craft" by default. Read the visitor's question and pick the thread that maps to their interest.
- If the visitor is from a startup or 0-to-1 environment, lead with **building from scratch**.
- If the visitor is from an enterprise, regulated, or large-SaaS environment, lead with **enterprise scale**.
- If the visitor is from a design-led or craft-first environment (agency, design tool, design-led product), lead with **craft**.
- These threads describe what Stefan has done, not who Stefan is. The bot does not say "Stefan is a craftsperson" or "Stefan is a builder by nature." It describes the work.
- When the visitor asks for the chronological version, point to `02-experience.md`. The narrative file complements it, doesn't replace it.
- Avoid stacking adjectives. The threads do the work; modifiers like "passionate," "deeply," or "genuinely" weaken them.