// Claude prompt + tool schema for generating the brief narrative.
//
// The scorer has already computed the honest numbers (admit, visa, ROI,
// fit bands, risk flags, cohort sizes). The LLM's job is strictly narrative:
//  1. Write the one-sentence verdict
//  2. Write per-program rationales (3–4 sentences each)
//  3. Surface 2–4 edge moves — non-obvious moves the counselor won't make
//  4. Write the 3-item action plan
//
// The LLM is not allowed to invent numbers. Every statistic in its output
// must come from the structured context we hand it.

import type { StudentProfile } from "./profile";
import type { ProgramScore, RiskFlag } from "./scoring";
import {
  COLLEGE_TIER_LABEL,
  WORK_BUCKET_LABEL,
  INTENT_LABEL,
  FIELD_LABEL,
} from "./profile";

export const SYSTEM_PROMPT = `You are Leap Intelligence — the honest, first-principles decision tool for Indian students applying abroad. Your job is to help a 21-year-old and their parents make the single biggest financial bet of their lives with clear eyes.

Voice: Helpful older sibling. Direct, warm, zero fluff. Never salesy, never generic. You tell the student things their counselor won't tell them because you have no partner incentives.

Rules you never break:
1. You ONLY use the numbers you're given in the structured context. You do NOT invent admit rates, salaries, visa odds, cohort sizes, or anything numerical.
2. You respect the portfolio the scoring engine produced. You do not second-guess which programs are on the list.
3. You are willing to say "don't take this bet" when the math says so. Honesty is the product.
4. Your tone is confident but specific. No hedging words like "perhaps" or "might be worth considering." State what you see.
5. You speak TO the student, not about them. Second person.
6. No emojis. No marketing cliches. No "exciting opportunities" or "diverse options" language.

The student has already seen the scores. Your writing is the part that makes the numbers mean something — the verdict at the top, the rationale for each pick, the 2–4 non-obvious moves their counselor missed, and the 3 things to do tonight.`;

export function buildUserMessage(
  profile: StudentProfile,
  portfolio: ProgramScore[],
  flags: RiskFlag[],
): string {
  const profileBlock = formatProfile(profile);
  const portfolioBlock = formatPortfolio(portfolio);
  const flagsBlock = formatFlags(flags);

  return `# Student profile
${profileBlock}

# Portfolio (already scored by the engine — do not change these numbers)
${portfolioBlock}

# Risk flags (already computed — you can reference them in the verdict/action plan)
${flagsBlock}

# Your task
Generate the brief narrative by calling the \`emit_brief\` tool exactly once. For each field:

**verdict**: One sentence. Read the whole portfolio and name the bet honestly.
  Examples of the voice we want:
   - "You're a credible bet at 4 of these 6 programs, a stretch at 1, and Canada is closed to you in 2026 no matter what your draft looks like."
   - "Your math only works at the programs that don't require a GRE — and one of them (OMSCS) is the highest-ROI bet on this entire page."
   - "You're overpaying for brand at your top 2 picks, and the best alternate bet here isn't in any of the countries you said you wanted."

**verdictBand**: one of strong-bet, mixed-bet, thin-bet, not-worth-it. Be honest with yourself — most profiles will be mixed-bet or thin-bet.

**programRationales**: for each of the ${portfolio.length} programs in the portfolio, write a 3–4 sentence rationale (key = universityId). Reference the specific numbers you were given. Speak to the student directly. Mention the profile adjustment that matters most for this specific row (e.g. "your GRE is the number pulling you down here — not your CGPA"). Use the indianCohortNotes when they sharpen the point. Never just restate the numbers — interpret them.

**edgeMoves**: 2 to 4 non-obvious moves. These are the things the student's counselor will not tell them. Lean HARD on:
  - Alternate bets outside their preferred countries if the math is better (TU Munich often wins on ROI, OMSCS often wins on pure ROI)
  - Budget traps at their top pick
  - Visa reality for 2026 (F1 refusals, Canada collapse)
  - Cost hacks (online programs, cheaper German alternates, Ireland post-study visa)
  Each edge move has {kind, headline, body, referenceUniversityId?}. Kind is one of: alternate-bet, budget-trap, visa-reality, cost-hack. Body is 2–3 sentences, specific, uses numbers from the context. DO NOT write vague edge moves like "consider Germany" — name the specific program, the specific delta, the specific why.

**actionPlan**: exactly 3 items. Priority 1 is the single most important thing to do this week. Each item is {priority, action, why}. Keep each action concrete ("Retake the GRE targeting 325+") not vague ("Strengthen your profile"). The why is 1-2 sentences.

Do not write any prose outside the tool call.`;
}

function formatProfile(p: StudentProfile): string {
  return `- CGPA: ${p.cgpa.toFixed(1)} (on 10 scale)
- College: ${COLLEGE_TIER_LABEL[p.collegeTier]}
- GRE: ${p.gre ?? "not submitted"}
- TOEFL: ${p.toefl ?? "not submitted"}
- Work experience: ${p.workExperienceYears} years at ${WORK_BUCKET_LABEL[p.workExperienceBucket]}
- Target field: ${FIELD_LABEL[p.targetField]}
- Intent: ${INTENT_LABEL[p.intent]}
- Budget ceiling: $${p.budgetUSDCap.toLocaleString()} USD (${p.loanFunded ? "loan-funded" : "self-funded"})
- Preferred countries: ${p.preferredCountries.join(", ")}`;
}

function formatPortfolio(ps: ProgramScore[]): string {
  return ps
    .map((s) => {
      const u = s.university;
      const adj = s.profileAdjustments.slice(0, 3).join(" ");
      return `### ${u.id} — ${u.university} · ${u.programName}
- Country: ${u.country} · Tier: ${u.tierTag}
- Fit band: ${s.fitBand}
- Admit probability: ${(s.admitProbability * 100).toFixed(0)}%
- Visa probability: ${(s.visaProbability * 100).toFixed(0)}%
- Combined "landed" probability: ${(s.landedProbability * 100).toFixed(0)}%
- Total cost (${u.durationYears}y): $${s.totalCostUSD.toLocaleString()}
- 5-year expected earnings: $${s.fiveYearEarningsUSD.toLocaleString()}
- Net ROI: ${s.netROI >= 0 ? "+" : ""}${(s.netROI * 100).toFixed(0)}%
- Within budget: ${s.withinBudget ? "yes" : "NO"}
- Cohort size (for the drilldown): ~${s.cohortSizeApprox} Leap students
- Profile adjustments applied: ${adj || "none"}
- Indian cohort context: ${u.indianCohortNotes}`;
    })
    .join("\n\n");
}

function formatFlags(flags: RiskFlag[]): string {
  if (flags.length === 0) return "(none)";
  return flags
    .map((f) => `- [${f.severity}] ${f.title}: ${f.body}`)
    .join("\n");
}

// ────────────────────────────────────────────────────────────────────────
// Tool schema — Claude responds via tool_use with this exact shape
// ────────────────────────────────────────────────────────────────────────

export const EMIT_BRIEF_TOOL = {
  name: "emit_brief",
  description:
    "Emit the final Outcome Brief narrative for this student and portfolio.",
  input_schema: {
    type: "object",
    required: ["verdict", "verdictBand", "programRationales", "edgeMoves", "actionPlan"],
    properties: {
      verdict: {
        type: "string",
        description: "One honest sentence naming the bet.",
      },
      verdictBand: {
        type: "string",
        enum: ["strong-bet", "mixed-bet", "thin-bet", "not-worth-it"],
      },
      programRationales: {
        type: "object",
        description:
          "Map of universityId → 3-4 sentence rationale string. Must include an entry for every program in the portfolio.",
        additionalProperties: { type: "string" },
      },
      edgeMoves: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          required: ["kind", "headline", "body"],
          properties: {
            kind: {
              type: "string",
              enum: ["alternate-bet", "budget-trap", "visa-reality", "cost-hack"],
            },
            headline: { type: "string" },
            body: { type: "string" },
            referenceUniversityId: { type: "string" },
          },
        },
      },
      actionPlan: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          required: ["priority", "action", "why"],
          properties: {
            priority: { type: "integer", minimum: 1, maximum: 3 },
            action: { type: "string" },
            why: { type: "string" },
          },
        },
      },
    },
  },
} as const;

export interface BriefLLMOutput {
  verdict: string;
  verdictBand: "strong-bet" | "mixed-bet" | "thin-bet" | "not-worth-it";
  programRationales: Record<string, string>;
  edgeMoves: Array<{
    kind: "alternate-bet" | "budget-trap" | "visa-reality" | "cost-hack";
    headline: string;
    body: string;
    referenceUniversityId?: string;
  }>;
  actionPlan: Array<{
    priority: number;
    action: string;
    why: string;
  }>;
}
