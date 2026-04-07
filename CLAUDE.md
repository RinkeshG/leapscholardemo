# Leap Intelligence — Project Context

## What this is
A prototype of **Leap Intelligence**, an internal-tool-style outcome
prediction product, built to demonstrate AI product capability for a senior
PM application at Leap Scholar (Indian study abroad platform). The artifact
is shown to the founder (Arnav Kumar) to earn an interview, not shipped to
real users.

## Core thesis
Leap's competitor Leverage Edu just shipped LE AI (counselor copilot, AI
shortlisting, AI interviews). Leap's leapfrog move is not catching up on
shortlisting — it's building **outcome intelligence** using their unique
data on 250K+ student outcomes (admit rates, visa rates, employment
outcomes, loan performance). This prototype demonstrates what that product
looks like.

## Product framing
Leap Intelligence is a **student-facing tool** for Indian undergrads
considering studying abroad. The user is the student themselves (or a
parent on their behalf). The product answers one question honestly:
"Will I actually get in, and is it worth it?"

Tone: helpful older-sibling. Direct but warm. The brief itself stays
analytical because students want clear answers, not marketing fluff —
but the surrounding chrome (landing page, form labels, empty states,
section headings) reads like a friendly product, not an analyst terminal.

## Visual direction (Option A — Leap brand + Bloomberg core)
The chrome (header, buttons, accents, typography, semantic colors) follows
**Leap Scholar's actual brand identity**. The data core (recommendations
table, numerics, fit badges) stays dense and analytical because this is an
internal tool, not the consumer site.

### Brand tokens (from leapscholar.com)
- **Primary purple**: `#5452E4`
- **Light purple**: `#807EFC`
- **Pale purple**: `#C2C1FF`
- **Deep navy** (headings, dark text): `#1C1B64`
- **Success green**: `#007A4D`
- **Danger red**: `#D31510`
- **Warning gold**: `#E8C600`
- **Surface**: `#F8F8F8`

### Typography
- **Plus Jakarta Sans** — display, headings, the verdict, the student name
- **Inter** — body, labels, table cells
- **JetBrains Mono** — numerics in the recommendation table

### Component conventions
- Cards and buttons: `rounded-xl` (12px) — Leap's standard
- Table cells stay square (data feel)
- Primary CTAs use solid purple `#5452E4`, hover deep navy `#1C1B64`
- No emojis. No AI-app aesthetics (no gradients in chrome, no glow effects).

## What we're building
A single-page web app where an Indian student enters their profile and
receives a one-page **Outcome Brief** showing:
- A one-line verdict (the headline insight)
- 6–8 university recommendations with admit / visa / employment / ROI /
  cost predictions, sorted Target → Reach → Safety
- Profile-specific risk flags
- A methodology drawer that explains the model
- Per-row drilldown: base vs adjusted rate, cost breakdown, comparable
  Leap students, rationale

## What we are explicitly NOT building
- User accounts, authentication, persistent storage, databases
- Multi-page navigation or routing beyond a single flow
- A chat interface (this is a structured tool, not a chatbot)
- Anything that would take more than 2–3 days
- Real-time features, websockets, background jobs
- Admin dashboards, analytics, counselor management UI
- Mobile responsiveness beyond "doesn't break on phone"
- Streaming the LLM response (skeleton loader handles perceived latency)

## Tech stack (decided, do not suggest alternatives)
- Next.js 14 with App Router
- TypeScript (strict mode)
- Tailwind CSS
- Anthropic Claude API (`claude-sonnet-4-6`) for the LLM call
- Hardcoded TS file for the university dataset (no database)
- Deployed to Vercel
- Single page, single API route, no client-side routing

## Design principles
- **Internal-tool density** — information per pixel matters. Bloomberg
  terminal, not chat UI, in the data core.
- **Leap brand chrome** — purple, Plus Jakarta Sans, rounded cards, deep
  navy headings. The thing must look unmistakably like Leap shipped it.
- **Every number has provenance** — methodology drawer is one click away
  from any number on screen.
- **The brief fits on one screen** at 1400px desktop resolution.
- **Typography is the design** — clean, hierarchical, readable.
- **No "demo tells"** — no fixture-mode badges, no v0.1 stickers, no
  disclaimer banners. The product behaves like a real product even when
  the API key is missing.
- **Landing first, brief second** — visitors land on a hero with the
  intake form centered, NOT a pre-loaded example brief. They generate
  their own. Sample profiles are an opt-in shortcut, not the default.
- **Friendly chrome, analytical core** — landing page, form labels, empty
  states, and section headings read like a consumer product. The brief
  table itself stays dense and quantitative.

## File structure
- `/app/page.tsx` — single page; intake sidebar + brief + drawers
- `/app/api/generate-brief/route.ts` — single API route, calls Claude
- `/app/layout.tsx` — fonts, metadata
- `/app/globals.css` — base styles, print stylesheet, drawer animations
- `/lib/universities.ts` — hardcoded dataset (US, UK, Canada, Australia, Germany)
- `/lib/prompts.ts` — system prompt and tool schema
- `/lib/types.ts` — TypeScript types
- `/lib/fixtures.ts` — demo profiles + fallback brief
- `/lib/methodology.ts` — methodology copy used in the drawer
- `/lib/cache.ts` — in-memory profile→brief cache for the route
- `/components/IntakeForm.tsx` — left sidebar form
- `/components/OutcomeBrief.tsx` — the brief renderer
- `/components/MethodologyDrawer.tsx` — right-side drawer
- `/components/RecommendationDrawer.tsx` — per-row drilldown drawer
- `/components/BriefSkeleton.tsx` — loading skeleton

## Code style
- TypeScript strict mode
- No unnecessary abstractions — this is a prototype, not a production app
- Tailwind only, no separate CSS files except `globals.css`
- Functional components only
- Server components by default; client components only where needed
- No state management library — `useState` is enough
- No error handling for impossible cases — only at the API boundary

## Workflow rules
- Make small, focused changes the user can review
- Ask before installing new dependencies
- If something is ambiguous, ask rather than assume
- After each change, tell the user what to test and how

## What success looks like
- A deployed prototype at a clean Vercel URL
- A 1-page Outcome Brief that visibly impresses on first look
- Five demo profiles that produce meaningfully different outputs
- A methodology drawer that survives a "how does this work?" question
- Per-row drilldown that survives a "where does this number come from?" question
- A working LLM call (`claude-sonnet-4-6`) that produces structured,
  consistent results
- Total build time under 20 hours
