# Leap Intelligence

A working prototype of **Leap Intelligence** — a counselor-facing outcome
prediction product for [Leap Scholar](https://leapscholar.com). Built as a
PM portfolio artifact to demonstrate AI product capability.

> **Not affiliated with Leap Scholar.** This is an unsolicited prototype
> built to show what an outcome-intelligence layer could look like, sitting
> behind Leap's existing consumer experience.

## The thesis

Leap's competitor Leverage Edu shipped LE AI in late 2024 — a counselor
copilot, AI shortlisting, AI interviews. The obvious play for Leap is to
match feature-for-feature. The non-obvious play is to leapfrog: skip
shortlisting and build **outcome intelligence** on top of Leap's unique
data moat — 250,000+ Indian student outcomes including admit decisions,
visa results, employment outcomes, and loan repayment performance.

This prototype is what that product looks like.

## What it does

A counselor (or student) enters a profile and receives a one-page
**Outcome Brief**:

- A one-line **verdict** that positions the student honestly
- Three **profile-specific risk flags** (visa, test scores, ROI compression, etc.)
- 6–8 **university recommendations**, each with predicted admit probability
  (adjusted from the published rate for the specific profile), visa
  approval rate, employment rate, median starting salary, 2-year ROI, and
  total cost in INR
- A sortable table; click any row for a per-program drilldown showing the
  base-vs-adjusted admit delta, comparable Leap students from the
  warehouse, cost breakdown, and the model's rationale
- A **methodology drawer** that explains every number on screen — the
  difference between "AI guessed" and "we built a model"

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  app/page.tsx                                                │
│  ├── IntakeForm  ──── POST /api/generate-brief               │
│  └── OutcomeBrief                                            │
│       ├── RecommendationDrawer  (per-row drilldown)          │
│       └── MethodologyDrawer     (model transparency)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  app/api/generate-brief/route.ts                             │
│  1. Validate profile                                         │
│  2. Cache check (in-memory, 1h TTL)                          │
│  3. Filter universities to chosen countries                  │
│  4. Call Claude (sonnet-4-6) with tool-use to enforce schema │
│  5. Validate + normalize: drop unknown IDs, clamp ranges,    │
│     re-derive fit bands from thresholds, sort deterministic  │
│  6. Cache + return                                           │
│                                                              │
│  Falls back to a hand-authored fixture brief if the API key  │
│  is missing OR the live call fails — UI is indistinguishable │
│  from a live response. Source flag is internal-only.         │
└─────────────────────────────────────────────────────────────┘
```

## Stack

- **Next.js 14** (App Router)
- **TypeScript** strict
- **Tailwind CSS** with Leap brand tokens (purple `#5452E4`, deep navy
  `#1C1B64`, Plus Jakarta Sans + Inter + JetBrains Mono)
- **Anthropic Claude API** (`claude-sonnet-4-6`) with tool-use for
  structured output
- Hardcoded TS dataset for universities — no database
- Single page, single API route, no client-side routing
- Deployed to Vercel

## Design philosophy

- **Internal-tool density** — the data core is Bloomberg terminal, not
  chat UI. Information per pixel matters.
- **Leap brand chrome** — purple, Plus Jakarta Sans, rounded cards. The
  thing must look like Leap shipped it.
- **No demo tells** — no fixture-mode badges, no v0.1 stickers, no
  disclaimer banners. The product behaves like a product.
- **Every number has provenance** — the methodology drawer is one click
  away from any number on screen.
- **Default-loaded brief** — landing shows a populated example brief, not
  an empty state.

## Local development

```bash
npm install
cp .env.example .env.local        # add ANTHROPIC_API_KEY (optional — fixture works without it)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's prototyped vs. what's real

**Prototyped:** the LLM call, the UI, the schema, the methodology surface,
five demo profiles that produce meaningfully different outputs, the
counselor workspace shell.

**Not real (yet):** the warehouse query — predictions are model-generated
against a hand-authored 16-program dataset. In production, the same model
would query the actual Leap warehouse for base rates, comparable-student
cohorts, and visa/employment ledgers per program-cohort cell.

## Five demo profiles

The intake form ships with five preset profiles that exercise different
parts of the model:

1. **Strong CS, top targets** — Aarav Mehta, GPA 9.1, GRE 328, IELTS 7.5
2. **Budget-constrained DS** — Priya Sharma, ₹35L cap, no GRE
3. **MBA career switcher** — Rohan Kapoor, 5y work ex, GMAT 710
4. **Strong GPA, weak tests** — Sneha Iyer, GPA 9.4 but GRE 305, IELTS 6.5
5. **Engineer optimizing ROI** — Vikram Reddy, multi-country including Germany

Each produces a meaningfully different brief — the GRE 305 profile gets
visa risk flags, the budget profile gets pushed toward UK/Canada, the
Germany profile gets pushed toward TUM and RWTH for the cost ceiling.

## File structure

```
app/
  page.tsx                          single page
  layout.tsx                        fonts, metadata
  globals.css                       base + print stylesheet
  api/generate-brief/route.ts       single API route
components/
  IntakeForm.tsx                    left-side form
  OutcomeBrief.tsx                  the brief renderer
  BriefSkeleton.tsx                 loading state
  MethodologyDrawer.tsx             right-side drawer (model transparency)
  RecommendationDrawer.tsx          per-row drilldown
lib/
  types.ts                          domain types
  universities.ts                   16-program hand-authored dataset
  prompts.ts                        system prompt + tool schema
  fixtures.ts                       demo profiles + fallback brief
  methodology.ts                    methodology copy for the drawer
  cache.ts                          in-memory profile→brief cache
```

## Built by

Rinkesh Gorasia, as a portfolio artifact for a senior PM application.
