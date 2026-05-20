# Saloodo! — Zero-to-one and the MEA expansion

The deep story of Stefan's two years as founding designer at Saloodo!, DHL's digital freight marketplace. Includes the MEA expansion that took the platform from Dubai pilot to nine countries in six months.

The bot uses this file when someone asks for depth on Saloodo!, on founding-designer work, on the MEA expansion, on ML-powered marketplace work, or on Stefan's 0-to-1 experience.

---

## Reference

- **Client / employer:** Saloodo! GmbH (DHL Group)
- **Role:** Lead UX Designer / Founding Designer (first in-house designer)
- **Years:** May 2018 – April 2020
- **Scope:** Design system, frontend refactor, marketplace UX, ML-powered features, multi-market expansion

**Headline numbers:**
- 67% shipper growth (18,000 → 30,000 shippers in months during MEA expansion)
- 50+ countries by 2020
- MEA expansion: Dubai pilot to 9 countries in 6 months
- 40%+ reduction in shipment creation time for first-time users

---

## Origin — first in-house designer at a corporate startup

Saloodo! was DHL's bet on disrupting freight logistics — a digital marketplace connecting shippers with carriers in a market that was still mostly phone calls and PDFs. Until May 2018, DHL had relied on agencies and freelancers to get the startup off the ground. The concept was proven, but the platform needed a complete relaunch to scale.

Stefan joined as the first in-house designer. Over the next two years, he built the design team from scratch, established a user-centered design culture, and helped expand the marketplace from European pilot to global platform serving customers across three continents.

This was Stefan's crucible — where he learned to move at startup velocity, measure everything that mattered, and build infrastructure that could scale to 50+ countries without breaking.

## Refactoring for scale — the design system foundation

Stefan's first job was building the infrastructure for rapid geographic expansion. He built a new design system from scratch — a living style guide based on Atomic Design principles, reusable components that could adapt to different markets without constant redesign. Design tokens connected directly to React components so changes propagated automatically.

Working with engineering, the team rebuilt the entire frontend in React/Redux. This wasn't just a visual refresh — they systematically eliminated technical debt and created a foundation that could handle exponential growth.

**Tool stack:**
- Abstract for design version control
- Atomic Design as the methodology
- Sketch for UI design
- Zeplin for handoff
- Storybook as the living style guide
- React/Redux for the frontend
- BrowserStack for cross-browser component testing

**The result:** the team launched across multiple European markets in rapid succession — Netherlands, Italy, Poland, Austria, Denmark — each rollout taking weeks instead of months because they'd built scalable infrastructure. The refactored platform could handle regional variations (language, currency, regulations) without forking the codebase.

Backed by DHL's trust and the improved conversion rates, the team achieved profitable unit economics that justified aggressive marketing spend. They built a loyal customer base that kept coming back because the product actually worked well.

## Data-driven disruptor — ML in the marketplace

Saloodo! had an unfair advantage: access to DHL's decades of freight data. The data science team used this to experiment with machine learning products completely new to the logistics industry — dynamic pricing models, load optimization algorithms, carrier recommendation systems.

Stefan worked closely with data engineers, translating complex algorithms into interfaces users could trust. The most sophisticated work was the PTL (Part Truckload) optimization engine: the platform tracked carriers' booked routes and available capacity, then recommended compatible shipments along their existing routes.

This created real marketplace efficiency. Carriers filled partially empty trucks with shipments they were already driving past — reducing empty miles, improving utilization, and enabling competitive pricing because marginal cost was low. Shippers got better rates. Carriers improved margins. The algorithm generated value for both sides.

This collaboration taught Stefan how machine learning models work, what data they need, and how to design experiences that make complex algorithms trustworthy. More importantly: how smart algorithms create marketplace value, not just automate processes.

## Measuring what matters — UX ROI as a first-class discipline

In startups, you build what drives customer lifetime value and measurable return — not only what stakeholders request or what's cool. Stefan established reporting frameworks connecting design decisions directly to business outcomes.

He partnered with performance marketing to build comprehensive tracking infrastructure, then established bi-weekly product performance reviews with cross-functional teams. The reviews examined what actually mattered: CAC trends, LTV:CAC ratios, payback periods, funnel drop-offs, unit economics. Together as a team, they gained common understanding of goals and ROI.

Every major feature had defined success metrics: conversion lift, retention improvement, cost reduction. Stefan analyzed qualified user test results together with hard analytics — task completion times, session recordings, conversion data. By identifying friction points and presenting actionable insights, the team systematically improved the experience and reduced shipment creation time for first-time users by over 40%.

**Stack:**
- Hotjar for behavioral analytics
- Intercom for customer messaging and feedback
- Elastic for search and data
- Segment for analytics routing
- Salesforce for CRM
- Google Tag Manager + Google Analytics
- Power BI for executive dashboards

**Prioritization discipline:** every potential feature was scored on business value (revenue impact, cost savings, strategic importance) and user value. Without quantified evidence from at least one dimension, features didn't make it on the roadmap. The team changed the platform with confidence because they had the data and asked the right questions. They experimented, measured, and iterated faster than traditional logistics companies could schedule a meeting.

## MEA expansion — Dubai pilot to nine countries in six months

By early 2019, Saloodo! had proven itself in Europe. DHL saw massive opportunity in Middle East & Africa, but the business model needed fundamental adaptation. The MEA market had different dynamics — high smartphone penetration but lower trust in purely digital platforms, different logistics infrastructure, different payment norms, different regulatory environments.

**The question:** could the team scale Saloodo! globally while adapting to radically different markets? Or would each region require a forked codebase, separate teams, and endless customization?

### Design Thinking workshops in Dubai

Stefan traveled to Dubai to lead stakeholder workshops with local DHL teams, potential customers, and carrier partners. Design Thinking methodologies surfaced what actually needed to change versus what could stay the same.

**Critical insights:**
- MEA customers needed local DHL entity contracts, not just marketplace transactions, to build trust
- WhatsApp was the business platform — SMS and email were insufficient
- Markets required convoy shipments for high-value goods due to security concerns
- Some markets needed a pure marketplace model while others required a DHL-backed forwarder hybrid

### The solution: scalable multi-tenant architecture

Based on these insights, Stefan designed UX flows, sitemaps, and visual design for a multi-tenant platform that could serve multiple DHL business units with separate branding, workflows, and margin structures. Two distinct business models could run on the same infrastructure.

Regional customizations like WhatsApp integration, local payment methods, and convoy services worked without rebuilding the core platform.

### Go-to-market — speed as competitive advantage

The rollout happened fast:
- UAE with Dubai as regional headquarters first
- All six GCC countries within six weeks
- Egypt and Jordan followed (Cairo kickoff event drew 238 attendees)
- November: South Africa, becoming the first international digital freight platform on the African continent (over 150 attendees at the Sandton event)

Nine countries in six months. Faster than any European expansion. MEA directly drove growth from 18,000 to 30,000 shippers.

Each additional country took days, not months, because the tenant architecture solved most complexity once. Regional teams could customize what mattered locally while core platform logic remained shared. One codebase. One design system. Multiple markets.

### Strategic impact

The MEA expansion validated the entire global strategy. It proved Saloodo! could adapt to radically different markets without breaking. By the time Stefan transitioned to lead myDHLi in April 2020, the platform was operating on four continents — and the foundation built in those Dubai workshops made it possible.

## What this case study illustrates

- **0-to-1 with no playbook teaches you what to leave out.** Building from zero forces clarity on what's essential. Stefan didn't have the luxury of inherited processes — he wrote them as the team shipped.
- **Research before translation.** The MEA expansion only worked because the workshops happened first. The default assumption would have been "translate the European product." The research showed what actually needed to change at the model level — trust, payment, communication — and what could stay shared.
- **Multi-tenant architecture is a design problem before it's an engineering problem.** The flows and sitemaps Stefan designed in Dubai are what made the codebase shareable. Architecture follows information design.
- **Design at startup velocity requires UX ROI as a habit, not a project.** Without quantified evidence — at least one of business or user value — features don't make the roadmap. That discipline is what allows the team to experiment fast without flying blind.
- **Designing with ML teams means designing with model behavior, not around it.** The PTL optimization engine taught Stefan to treat algorithms as design material, not as black-box outputs to wrap in UI.

## How the bot should handle this case study

- When asked about Saloodo!, the MEA expansion, founding-designer work, or Stefan's 0-to-1 experience, this is the source.
- The MEA expansion is the most quoted story across Stefan's applications. The bot can tell it in full when asked for depth, or compress to "Dubai pilot to nine countries in six months, 18,000 to 30,000 shippers" for shorter answers.
- The "trust dynamics, payment norms, and communication channels needed fundamental UX adaptations, not translations" line is a recurring phrasing in Stefan's own application materials. The bot can use it.
- For ML-powered marketplace work, the PTL example is the strongest single anecdote. Use it when an AI or marketplace-fluent visitor asks.
- For full visual context and screenshots, point to stefanheissenberg.de/design-portfolio-sh/saloodo.
