import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import type { StudentProfile } from "@/lib/profile";
import type {
  BriefResponse,
  OutcomeBrief,
  ProgramDrilldown,
} from "@/lib/brief-types";
import { buildPortfolio, computeRiskFlags } from "@/lib/scoring";
import {
  buildCostBreakdown,
  generateComparableCohort,
} from "@/lib/cohorts";
import {
  EMIT_BRIEF_TOOL,
  SYSTEM_PROMPT,
  buildUserMessage,
  type BriefLLMOutput,
} from "@/lib/brief-prompts";
import { getCachedBrief, setCachedBrief } from "@/lib/cache";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-5";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let body: { profile?: StudentProfile };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const profile = body.profile;
  if (!profile) {
    return NextResponse.json({ error: "Missing profile" }, { status: 400 });
  }
  const validation = validateProfile(profile);
  if (validation) {
    return NextResponse.json({ error: validation }, { status: 400 });
  }

  // Cache check
  const cached = getCachedBrief(profile);
  if (cached) {
    const resp: BriefResponse = {
      brief: cached,
      latencyMs: Date.now() - startedAt,
      fromCache: true,
    };
    return NextResponse.json(resp);
  }

  // 1. Deterministic scoring — math first, narrative second
  const portfolio = buildPortfolio(profile);
  if (portfolio.length === 0) {
    return NextResponse.json(
      {
        error:
          "No programs matched your preferences. Try widening your country selection.",
      },
      { status: 400 },
    );
  }

  // Credibility floor: if every program in the portfolio is below the noise
  // floor (admit < 8%), the honest answer is "your profile isn't a credible
  // bet anywhere on this list yet" — not a misleading brief showing 5%
  // probabilities as if they were real shots.
  const credibleBets = portfolio.filter((s) => s.admitProbability >= 0.08);
  if (credibleBets.length === 0) {
    return NextResponse.json(
      {
        error:
          "Your profile is below the credibility floor for every program on this list. The honest move is to strengthen the profile first — raise CGPA if you're still in undergrad, take the GRE targeting 320+, or get 12–18 months of work experience at a recognizable company. Come back when one of those numbers has changed.",
      },
      { status: 400 },
    );
  }
  const riskFlags = computeRiskFlags(profile, portfolio);

  // 2. LLM narrative pass
  let llmOutput: BriefLLMOutput;
  try {
    llmOutput = await runNarrativePass(profile, portfolio, riskFlags);
  } catch (err) {
    console.error("LLM narrative pass failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate brief narrative",
      },
      { status: 500 },
    );
  }

  // 3. Build per-program drilldowns (deterministic, no LLM)
  const drilldowns: Record<string, ProgramDrilldown> = {};
  for (const score of portfolio) {
    const u = score.university;
    const rationale =
      llmOutput.programRationales[u.id] ??
      `This program scored ${Math.round(score.landedProbability * 100)}% combined admit × visa for your profile.`;
    drilldowns[u.id] = {
      universityId: u.id,
      costBreakdown: buildCostBreakdown(u),
      comparableStudents: generateComparableCohort(
        profile,
        u,
        score.admitProbability,
      ),
      rationale,
    };
  }

  const brief: OutcomeBrief = {
    studentName: profile.studentName,
    generatedAt: new Date().toISOString(),
    profile,
    verdict: llmOutput.verdict,
    verdictBand: llmOutput.verdictBand,
    portfolio,
    edgeMoves: llmOutput.edgeMoves,
    riskFlags,
    actionPlan: llmOutput.actionPlan.sort((a, b) => a.priority - b.priority),
    drilldowns,
  };

  setCachedBrief(profile, brief);

  const resp: BriefResponse = {
    brief,
    latencyMs: Date.now() - startedAt,
    fromCache: false,
  };
  return NextResponse.json(resp);
}

// ────────────────────────────────────────────────────────────────────────

function validateProfile(p: StudentProfile): string | null {
  if (typeof p.cgpa !== "number" || p.cgpa < 4 || p.cgpa > 10)
    return "CGPA must be between 4.0 and 10.0";
  if (!p.collegeTier) return "College tier is required";
  if (p.gre != null && (p.gre < 260 || p.gre > 340))
    return "GRE must be between 260 and 340";
  if (
    typeof p.workExperienceYears !== "number" ||
    p.workExperienceYears < 0 ||
    p.workExperienceYears > 20
  )
    return "Work experience years must be 0–20";
  if (!p.workExperienceBucket) return "Work experience bucket is required";
  if (!p.targetField) return "Target field is required";
  if (!p.intent) return "Intent is required";
  if (
    typeof p.budgetUSDCap !== "number" ||
    p.budgetUSDCap < 10000 ||
    p.budgetUSDCap > 1000000
  )
    return "Budget must be between $10K and $1M";
  if (!Array.isArray(p.preferredCountries) || p.preferredCountries.length === 0)
    return "Pick at least one preferred country";
  return null;
}

async function runNarrativePass(
  profile: StudentProfile,
  portfolio: ReturnType<typeof buildPortfolio>,
  riskFlags: ReturnType<typeof computeRiskFlags>,
): Promise<BriefLLMOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback for local dev without an API key
    return fallbackOutput(portfolio);
  }

  const client = new Anthropic({ apiKey });
  const userMessage = buildUserMessage(profile, portfolio, riskFlags);

  const result = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    tools: [EMIT_BRIEF_TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: "emit_brief" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = result.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) throw new Error("Model did not return a tool_use block");

  const raw = toolUse.input as unknown as BriefLLMOutput;
  // Minimal shape validation
  if (!raw || typeof raw.verdict !== "string") {
    throw new Error("Invalid tool output: missing verdict");
  }
  if (!raw.programRationales || typeof raw.programRationales !== "object") {
    throw new Error("Invalid tool output: missing programRationales");
  }
  if (!Array.isArray(raw.edgeMoves) || raw.edgeMoves.length < 2) {
    throw new Error("Invalid tool output: edgeMoves must have at least 2");
  }
  if (!Array.isArray(raw.actionPlan) || raw.actionPlan.length !== 3) {
    throw new Error("Invalid tool output: actionPlan must have exactly 3 items");
  }
  return raw;
}

// Silent fallback (no "demo mode" branding — the product behaves normally
// even when the key is missing, just with blander narrative)
function fallbackOutput(
  portfolio: ReturnType<typeof buildPortfolio>,
): BriefLLMOutput {
  const programRationales: Record<string, string> = {};
  for (const p of portfolio) {
    const u = p.university;
    programRationales[u.id] =
      `Combined admit × visa probability at ${u.university} works out to ${Math.round(p.landedProbability * 100)}% for your profile, at a total cost of $${Math.round(p.totalCostUSD / 1000)}K. ${p.profileAdjustments[0] ?? ""}`.trim();
  }
  return {
    verdict:
      "A mixed portfolio — the math is honest, the fit bands tell you where to spend your energy.",
    verdictBand: "mixed-bet",
    programRationales,
    edgeMoves: [
      {
        kind: "alternate-bet",
        headline: "Consider the lowest-cost alternate bet on the list",
        body: "The highest-ROI program here is rarely the one with the best ranking. Look at the net ROI column and follow the money.",
      },
      {
        kind: "visa-reality",
        headline: "2026 visa math is different",
        body: "Every US and Canada pick should be read as admit × visa, not just admit. We've baked this into the portfolio ranking.",
      },
    ],
    actionPlan: [
      {
        priority: 1,
        action: "Confirm your budget ceiling with your family this week",
        why: "Every other decision on this page hinges on whether you can actually absorb the cost if the employment story is delayed 6–12 months.",
      },
      {
        priority: 2,
        action: "Apply to the target-band programs first",
        why: "Your highest expected value comes from the programs the scorer marked as 'target' — these are where your profile lines up and your odds are real.",
      },
      {
        priority: 3,
        action: "Take one reach pick — only one",
        why: "Reach applications cost real money and time. A single reach is a rational lottery ticket; three is a budget problem.",
      },
    ],
  };
}
