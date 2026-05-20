# myDHLi — DHL Global Forwarding's central B2B portal

The deep story of Stefan's six-year chapter at DHL Group, from initial concept to a platform serving 22,000+ enterprise customers.

The bot uses this file when someone asks for depth on myDHLi, on the US onboarding initiative, on the design system rollout, or on Stefan's enterprise work in general. Lighter references to myDHLi already appear in `00-identity.md`, `01-narrative.md`, `02-experience.md`, and `08-faq.md`. This file is where the story lives in full.

---

## Reference

- **Client / employer:** DHL Group (DHL Global Forwarding)
- **Role:** Founding concept designer (2018, while at Saloodo!), then Head of Design (April 2020 – present)
- **Years:** 2018 – present
- **Scope:** Strategy, research, design system, product tracks, distributed team leadership

**Headline numbers:**
- 22,000+ enterprise customers across 50+ countries
- 30M+ monthly interactions
- €336B+ in annual cargo value
- 91% faster customer onboarding (10-12 days → under 24 hours)
- $2.5B addressable segment unlocked through the onboarding rebuild
- DHL Group's first scaled design system across multiple business units

---

## Origin — the startup chapter inside a logistics giant

Stefan joined DHL through Saloodo!, DHL's digital marketplace startup. Saloodo! operated as DHL's "digital speedboat" — small enough to move fast, protected enough to take risks. Outside DHL's walls, the logistics industry was being digitized fast: Flexport raised $1B, Amazon Freight cut prices by 30%, Uber Freight scaled globally. The $800B logistics industry was up for grabs, and DHL needed to be in the race.

In late 2018, while Stefan was still at Saloodo!, DHL Global Forwarding asked him to sketch what a unified B2B portal could look like — one place to replace the dozens of disconnected apps customers were navigating. The brief: one platform, 360° shipment visibility across air, ocean, road, and rail, available 24/7 anywhere in the world.

The problem wasn't really a design problem. It was an organizational one. Decoupling legacy systems. Introducing agile to teams that had only ever shipped waterfall. Convincing stakeholders that dozens of apps had to become one customer experience — and meaning it.

## Launch — four weeks across five continents

In April 2020, Stefan took over as Head of Experience Design for myDHLi. Four weeks later, the team shipped to production — Quote + Book, Follow + Share, real-time tracking, analytics dashboards, single sign-on — across five continents while the world was locked down.

COVID didn't stop the rollout. It made the case for it. Customers who had relied on phone calls and emails suddenly needed a self-service portal that worked. The team had one ready.

The enterprise customer base that adopted the portal included HP, Dell, Bayer, Apple, Airbus, 3M, Johnson & Johnson, Siemens, Nokia, Samsung, and Boeing — the kind of accounts where every interaction matters and every flow has to be earned.

## Research — building the foundation from scratch

When Stefan arrived at myDHLi, the research infrastructure didn't exist. Decisions were intuition-led. Stakeholders had strong opinions and there was no way to test them.

He built the foundation from zero. UserTesting, Hotjar, Adobe Analytics, Google Analytics, custom KPI dashboards wired into the product teams. Then he put research rhythms inside the sprint cycle, so the work stayed close to the evidence.

The team changed with it. Designers embedded in cross-functional squads. Major releases blocked on user testing. A shared research repository made findings accessible across teams. Workshops on research methods and data interpretation kept the muscle alive across product, engineering, and business — 50+ team members trained.

Stakeholder collaboration changed too. Discussions ran on facts. Results were measurable. The work became a shared conversation instead of a negotiation. User-centered thinking became the default starting point for decisions, not the checkpoint near the end.

The Shift Sentence, in Stefan's own published words from the portfolio:

*"We stopped building what stakeholders requested and started building what data and users actually pointed to."*

## The 91% onboarding rebuild — the story Stefan is proudest of

The portal had always meant to serve smaller customers. The economics had never allowed it. Operational costs made one-time shipments unprofitable, and a 10-12 day onboarding process was too slow for companies with lower shipment volumes. The enterprise accounts were covered. Everyone else was losing interest before they got started.

A cross-functional initiative for the US market opened the window. Stefan came in as lead designer to rebuild the online sales experience — remove friction, accelerate onboarding, and make smaller accounts economically viable.

Process mapping surfaced the real bottleneck. It wasn't compliance itself — it was the layers of review and approval between departments that compliance had been blamed for. That insight reframed the project.

Workshops with operations and sales rebuilt the workflow. Decision-making consolidated. Redundant approvals removed. Clear data-driven criteria replacing subjective gates. Onboarding dropped from 10-12 days to 3-4 days *before a single new feature shipped.* The KPIs got reported back. The numbers gave the team room to keep pushing.

Full digital enablement then brought setup times to under 24 hours.

A self-registration concept had been sitting in Stefan's drawer for years — instant booking access, automated account creation, compliance running in the background. It hadn't moved because the business case had never been loud enough. The 91% reduction made it loud. Stakeholder support arrived. Priority shifted. The concept moved from drawer to foundation inside the same project.

**Outcomes:**
- Setup time: 10-12 days → under 24 hours (91% reduction)
- $2.5B small-business segment unlocked
- Senior leadership adopted the new process as the blueprint for other DHL markets worldwide
- Small customers landed on the roadmap with the same weight as enterprise ones

The result Stefan cares about most isn't the 91%. It's that the small shippers — the founders, the teams without an account manager on speed dial — finally got the same digital service the enterprise accounts took for granted. Standing in for users without a stakeholder voice, and backing them with the research and data that gives them weight in the room. Building momentum patiently enough that when the window opens, the team is ready to take the shot.

## Design system — when components became the guideline

DHL had fragments. Guidelines updated every few years. Libraries that competed across divisions — myDHLi, dhl.com, legacy portals — with no shared technical base. Every team rebuilt the same buttons from scratch.

From 2020 to 2025, Stefan's team built DHL Group's first scaled design system. The work started with an audit. Every component, every use case, every portal. Then a choice — replace everything, or build the foundation underneath what already existed. They built the foundation. The myDHLi library aligned with existing tech stacks while creating space to harmonize the design.

Then dhl.com came in. Cross-division collaboration merged the library with the primary system. The team survived three tool transitions — Abstract → Sketch Cloud → Figma — without losing consistency.

Stefan represented multiple business units on a DHL Group-wide committee, helping define the standards for what came next.

**The technical foundation:**
- Stencil for web components, compiled into React, Vue, and Angular — one button, three frameworks, no forking
- Lerna for monorepo management
- Storybook for component development in isolation
- TypeScript, Jest, and Puppeteer for testing
- Docusaurus for docs
- Azure for CI/CD
- Figma libraries connected to live frontend as source of truth — no more PDFs

The shift: guidelines used to describe components. Now the components are the guideline — living frontend with connected Figma libraries as the source of truth. Faster development. Consistent experiences. The foundation everything new gets built on.

## Team and design ops — three to five times more projects, roughly the same team

myDHLi grew. More customers, more product tracks, more stakeholders. The design organization had to grow with it without breaking what made it good.

Headcount was the easy part. The harder part was the frameworks: documentation as the default, async-first across EMEA time zones, dual-track agile so discovery and delivery ran in parallel, and governance that let designers from other divisions contribute to the system without breaking it.

The Figma move was the turning point. It became the home for the design system and the open playground for sharing — the invitation other teams needed to contribute. The internal design community started talking across divisions in a way that wasn't possible before.

The result: three to five times more projects with roughly the same team size. The infrastructure was built to do that.

## What this case study illustrates

- **Enterprise complexity is mostly an organizational problem.** Decoupling legacy systems, negotiating with stakeholders, and building governance that doesn't slow teams down. Design is the visible layer; the work underneath is political and structural.
- **Compliance is a design problem.** The 91% rebuild proves it. Compliance wasn't the bottleneck — the redundant approval layers around it were. Mapping the actual process unlocked the change.
- **Research infrastructure built from zero is the most durable thing a design leader can leave behind.** It outlasts roadmap shifts and political turnover because it changes how decisions get made.
- **A design system in production code is worth ten in Figma.** The DHL system runs as code that ships to three frameworks. Figma is the source of truth, but the truth lives in components, not files.
- **Patience is a product skill.** The self-registration concept sat in Stefan's drawer for years before the business case got loud enough. Timing the push matters as much as having the concept.

## How the bot should handle this case study

- When asked about myDHLi, the design system, the onboarding initiative, or Stefan's enterprise work in general, this is the source.
- The 91% onboarding story is the single strongest narrative Stefan has. The bot can tell it in full when asked for depth, or compress it to "10-12 days to under 24 hours, $2.5B segment unlocked" for shorter answers.
- The "Shift Sentence" is Stefan's own published words from the portfolio. The bot can quote it verbatim with attribution.
- Don't recite all the headline numbers in one answer. Pick the 2-3 that match the conversation.
- For technical depth on the design system, the file has the stack details. Surface them only when the visitor's question warrants it.
- For full visual context and screenshots, point to stefanheissenberg.de/design-portfolio-sh/dhl.
