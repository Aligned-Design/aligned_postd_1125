# POSTD – Product Definition & System Guardrails (Cursor Master Doc)

## How Cursor Should Use This File

- Treat this as the **product and behavior spec** for POSTD.

- Before adding, removing, or refactoring features, **check this doc for alignment**.

- If any other doc conflicts with this one, assume:

  - This doc **+** the DB schema in `supabase/migrations/001_bootstrap_schema.sql`

  - are the **authoritative truth**, unless explicitly told otherwise.

If a decision is needed ("Do we add this? remove this? change this?"), **always consult this file first.**

---

## 1. High-Level Product Purpose

POSTD is a **brand-driven AI content platform**.

Its purpose is to allow users (agencies, businesses, creators) to:

- Create a **brand workspace**

- Generate a complete **brand guide** from a website crawl

- Generate **AI-powered text + visual content** aligned to that brand

- Edit visuals inside the **Creative Studio**

- Schedule and **publish to connected social accounts**

- Collaborate with clients via **approvals**

- View **performance analytics**

**No feature** should drift outside this purpose.  
**No subsystem** should behave independently from brand context.

---

## 2. Required System Pillars (Non-Negotiable)

Cursor should treat these 7 pillars as the **backbone of POSTD**:

### Pillar 1 — Brand Intake Engine

Website crawler pulls:

- 10–15 images

- brand colors

- logo(s)

- headlines + major text

- About/Services summaries

Stores structured results in `crawl_results`.

If the crawler:

- extracts too few images,

- extracts too few colors,

- or returns stock/irrelevant items

→ **FIX THE CRAWLER OR HEURISTICS.**

---

### Pillar 2 — Brand Guide Generator

Converts the crawl into a structured brand guide:

- personality

- tone & voice

- color palette

- key messaging

- value props

- audience

- paragraph summaries

If any section is missing → **regenerate**.  
If output is generic → **improve prompts or fix Brand Brain inputs.**

---

### Pillar 3 — Brand Brain

Central knowledge object used across:

- content generation

- template autofill

- insights

- BFS (Brand Fidelity Score)

Any new feature **MUST** reference Brand Brain.  
Nothing should generate content **without brand context**.

---

### Pillar 4 — Creative Studio

Includes:

- Blank Canvas

- Template Grid

- AI → Canvas flow

- Variant generator

- Drag/drop editor

If a design:

- does not render,

- does not save,

- or uses generic styling

→ **FIX IT.**

Templates **MUST** use brand colors.

---

### Pillar 5 — Content Generation Engine

Uses:

- brand guide

- brand voice

- brand visuals (where applicable)

Creates:

- captions

- social posts

- graphics

- reels ideas

- emails/blogs (**text only for now – do NOT build a full email designer yet**)

If content sounds generic or off-brand → improve prompts or fix Brand Brain.

---

### Pillar 6 — Scheduler + Social Connectors

Support:

- TikTok

- Instagram

- Facebook

- LinkedIn

- Google Business

Scheduler handles:

- queues

- jobs

- retries

- post previews

- client approval states

If posting fails → check:

- connectors

- job queue

- tokens

- brand permissions

---

### Pillar 7 — Multi-Brand & Agency Mode

Every brand:

- is isolated via **RLS**

- has **members + roles**

- has its own **brand guide + assets**

- has its own **history + analytics**

If any data leaks across brands → this is a **HIGH PRIORITY FIX**.

---

## 3. In-Scope vs Out-of-Scope

### In-Scope (Must Exist / May Be Improved)

POSTD absolutely should support:

- website crawling

- brand guide generation

- AI content creation

- Creative Studio

- social scheduling

- brand workspaces

- team roles & permissions

- client approval system

- analytics

- BFS scoring (phase 2+)

- asset library

- consistent design tokens

- multi-brand isolation

### Out-of-Scope (Do NOT Build Unless Explicitly Approved)

Cursor should **NOT** build:

- full CRM

- inventory management

- accounting/finance tools

- payroll

- invoicing systems

- calendar apps

- full website builder

- unrelated AI experiments

- personal project tools

- chatbot support widgets

- e-commerce checkout systems

If a feature does not directly align with:

> **Brand → Content → Scheduling → Analytics**

…then it should **NOT be added**.

---

## 4. UX Flows (Ground Truth)

Cursor must preserve these flows **exactly**.  
Do not "simplify" them in ways that break steps for users.

### Flow A — Brand Setup

1. Enter website URL  
2. Crawler runs  
3. Review/edit brand guide  
4. Brand Brain initialized  

If these steps break → **FIX THIS FLOW FIRST.**

---

### Flow B — Creative Studio

1. Select: Blank Canvas / Templates / AI → Canvas  
2. Edit design  
3. Save design  
4. Export or schedule  

If saving or rendering breaks → **FIX Creative Studio.**

---

### Flow C — AI Content

User provides:

- prompt OR

- brand guide context OR

- idea generator

AI produces:

- branded posts

- carousels

- reels ideas

- captions

- emails/blogs (text)

If output ignores brand guide → **FIX prompts or Brand Brain usage.**

---

### Flow D — Scheduling

User:

1. connects accounts  
2. chooses date/time  
3. schedules content  
4. sees it in calendar  
5. receives approval-flow notifications (where applicable)

If posting breaks → check:

- tokens

- jobs

- connector configs

- brand permissions

---

### Flow E — Client Approval

1. Creator sends for approval  
2. Client receives portal view  
3. Approve/deny  
4. Content moves to next state (ready to post or revise)

If approvals misfire → re-check:

- brand roles

- RLS

- scheduler states

---

## 5. Required Quality Standards (Cursor Must Enforce)

Cursor should ensure:

1. **Everything references brand context.**  

   - No generic output.

   - No content generated without a brand/Brand Brain.

2. **No duplicate code or dead files.**  

   - Remove unused migrations, old components, dead endpoints.

   - Archive or delete legacy code that is truly unused.

3. **Consistent Design System.**  

   - Use the same tokens, spacing, buttons, inputs.

   - Follow existing design system patterns; do not invent new ones without clear reason.

4. **Strict Type Safety.**  

   - All API routes fully typed.

   - Types must match the schema in `001_bootstrap_schema.sql`.

5. **Database must stay clean.**  

   - No orphaned brands.

   - No broken relationships.

   - `slug` must be unique.

   - RLS must fully isolate brands.

6. **Crawler must be reliable.**  

   - If stock/chaff content appears, improve heuristics.

   - If too few images/colors are found, improve crawl depth and logic.

7. **AI prompts must be centralized.**  

   - No scattered prompt strings.

   - Use standard prompt files / modules.

8. **All features must be testable.**  

   - Cursor should **add or update tests where practical**, especially for:

     - Brand Setup

     - Creative Studio

     - AI Content generation

     - Scheduling

     - Client Approvals

9. **No UI without backend logic.**  

   - No buttons, screens, or components that don't connect to real functionality.

   - Avoid "mock" features that look real but do nothing.

---

## 6. What Cursor Is Allowed (and Not Allowed) To Do

Cursor **is allowed** to:

- refactor for clarity

- unify prompts

- fix missing awaits / async issues

- remove unused dependencies

- fix migration order

- improve RLS

- update API usage

- improve crawler accuracy

- upgrade scheduler reliability

- rewrite broken queries

- clean dead code

- improve error handling and UX around existing flows

Cursor should **not**:

- add unrelated features

- introduce heavy libraries unless truly needed

- expand beyond this roadmap and pillars

- generate unrelated experiments

- build parallel systems that duplicate existing pillars

---

## 7. Definition of "Done" for Features

A feature is only **done** when:

- Works across all brands (no leaks, correct RLS)

- Uses brand context via Brand Brain or brand guide

- Survives page refresh

- Saves to the database correctly

- Has full type coverage for inputs/outputs

- Has **no console errors** in normal usage

- Has tests or reasonable test coverage for its critical paths

- Does **not** break Creative Studio

- Does **not** break scheduling

- Is reflected in analytics or history when applicable

- Is understandable and usable by a non-technical user

  - clear labels, no internal jargon, obvious next steps

Cursor can verify progress using automated tools (lint, typecheck, tests, and targeted manual run-throughs of key flows).

---

## 8. Priority of Constraints

If tradeoffs are needed, prioritize in this order:

1. Security & brand isolation (RLS, auth, `assertBrandAccess`)

2. Data integrity (schema alignment, slugs, relationships)

3. Core flows not breaking (Brand Setup, Creative Studio, Scheduling, Approvals)

4. Brand fidelity of content (Brand Brain, BFS)

5. Code clarity and removal of dead code

6. Visual/UX polish (clean, friendly, intuitive app)

---

## 9. Final Instruction to Cursor

Cursor must use this document as its **reference standard**.

Any time a decision is needed — "Do we add this? remove this? change this? refactor this?" — the agent should check:

- Does this align with POSTD's purpose?

- Does this map to a core pillar?

- Does this improve or preserve UX flows?

- Does this reduce confusion for non-technical users?

- Does this keep brand isolation safe?

- Does this improve content quality or reliability?

- Does this simplify the codebase and remove noise?

If the answer is **no**, Cursor should **NOT** implement it.  
If the answer is **yes**, Cursor should proceed and explain why in its summary.

---

END OF FILE CONTENT

