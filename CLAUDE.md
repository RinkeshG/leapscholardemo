# Outcome Brief — Project Context

## What this is
A prototype to demonstrate AI product capability for a senior PM
application at Leap Scholar (Indian study abroad platform). The artifact is
shown to the founder (Arnav Kumar) to earn an interview, not shipped to real
users.

## Core thesis
Leap's competitor Leverage Edu just shipped LE AI (counselor copilot, AI
shortlisting, AI interviews). Leap's leapfrog move is not catching up on
shortlisting — it's building outcome intelligence using their unique data
on 250K+ student outcomes (admit rates, visa rates, employment outcomes,
loan performance). This prototype demonstrates what that product looks like.

## What we're building
A single-page web app where a student enters their profile and receives a
one-page "Outcome Brief" showing not just which universities to apply to,
but their predicted outcomes at each — admit probability, visa approval
rate, employment outcomes, ROI, and risk flags.

## What we are explicitly NOT building
- User accounts, authentication, or persistent storage
- Multi-page navigation or routing beyond a single flow
- A chat interface (this is a structured tool, not a chatbot)
- Anything that would take more than 2-3 days
- Real-time features, websockets, or background jobs
- Admin dashboards, analytics, or counselor-facing UI
- Mobile responsiveness beyond "doesn't break on phone"
- Any feature not directly visible in the demo flow

## Tech stack (decided, do not suggest alternatives)
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- Anthropic Claude API (claude-sonnet-4-5) for the LLM call
- Hardcoded JSON file for university dataset (no database)
- Deployed to Vercel
- Single page, single API route, no frontend routing

## Design principles
- The output looks like a professional product, not a ChatGPT wrapper
- Information density over white space (think Bloomberg terminal, not chat UI)
- Every number on screen has a source or methodology note
- The brief fits on one screen at desktop resolution
- Typography is the design — clean, hierarchical, readable
- No emojis in the UI, no gradients, no AI-app aesthetics

## File structure
- /app/page.tsx — single page with profile intake + brief output
- /app/api/generate-brief/route.ts — single API route that calls Claude
- /lib/universities.ts — hardcoded university dataset
- /lib/prompts.ts — system prompt for the LLM
- /lib/types.ts — TypeScript types for profile and brief
- /components/ — UI components (intake form, brief renderer)

## Code style
- TypeScript strict mode
- No unnecessary abstractions — this is a prototype, not a production app
- Inline styles via Tailwind, no separate CSS files
- Functional React components only
- Server components by default, client components only where needed
- No state management library — useState is fine for everything

## Workflow rules
- Make small, focused changes I can review
- Show me what you're about to change before you change it on big edits
- Ask before installing new dependencies
- Ask before creating new files outside the structure above
- If something is ambiguous, ask rather than assume
- After each change, tell me what to test and how

## What success looks like
- A deployed prototype at a clean Vercel URL
- A 1-page Outcome Brief that visibly impresses on first look
- Five demo profiles that produce meaningfully different outputs
- A working LLM call that produces structured, consistent results
- Total build time under 20 hours
