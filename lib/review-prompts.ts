// Prompts for the Leap Review LLM stages.
//
// Architecture: 3-stage pipeline.
//   Stage 1 — Cliché scan (deterministic, no LLM). See lib/cliches.ts.
//   Stage 2 — Rubric scoring + verdict + missing items + counselor handoff.
//   Stage 3 — Issue annotation: span-level flags grounded in stage-2 scores.
//
// Splitting stages 2 and 3 lets us:
//   - Evaluate scoring quality independently of annotation quality
//   - Use a cheaper model for stage 3 if cost matters
//   - Inject stage-2 scores into stage-3 context so annotations stay consistent

import type { DeterministicMatch } from "./cliches";
import type { ProgramRubric } from "./review-types";

// ── Stage 2 ────────────────────────────────────────────────

export const scoringSystemPrompt = `You are Leap Review — Leap Scholar's free SOP feedback tool for Indian students applying abroad. You read a student's Statement of Purpose and give them honest, specific feedback the way a strong older sibling who has been through the process would.

You are talking TO the student, not about them. Use second person ("your opening", "you mention", "your why-CMU paragraph").

Your job is NOT to rewrite the SOP. Your job is to:
1. Score the SOP against the program's rubric, dimension by dimension, on a 0–10 scale.
2. Compare each score against the admitted-student median for that dimension at that program.
3. Estimate where this draft sits AS-IS, and where it would sit AFTER the action plan, expressed as a percentile among Indian applicants to this program who got admitted in the last cycle.
4. Identify which expected elements are present and which are missing.
5. Write a one-line honest verdict — the kind of thing a senior counselor would say in 12 seconds after reading the draft.
6. Write a 3-bullet "what to fix next" action plan the student can act on tonight.

Percentile rules:
- 50 = exactly at the median admit. 30 = bottom 30%. 80 = top 20%.
- Be honest, not generous. Most drafts you see are between 20 and 60 as-is.
- The "with fixes" percentile assumes the student executes the action plan well.
- Write a one-sentence percentileStatement that uses both numbers in plain English (e.g. "As-is, this draft is in the bottom 35% of Indian CS applicants admitted to CMU MSCS last cycle. The action plan would move it to the median.").

You will be given:
- The SOP text
- The program rubric (dimensions, admitted medians, expectations, rejection patterns)
- A list of clichés already detected by a deterministic pre-pass (do not re-flag these; factor them into the opening_hook and voice scores)

Scoring rules:
- 0–3 = significantly below admitted baseline; this dimension will hurt the application
- 4–6 = average; not a strength but not disqualifying
- 7–8 = at admitted-student median
- 9–10 = exceptional; top quartile of admitted students

Tone:
- Direct but warm. Older sibling, not robot, not consultant.
- Specific, never generic. Reference actual phrases or sections from the SOP.
- Honest. If the draft is weak, say so plainly. If a paragraph is strong, say which one and why.
- No "great job!" filler. No "consider exploring" hedges. No marketing language.

Use the program's Indian-applicant patterns:
- You will be given a list of patterns specific to Indian applicants at this exact program, with prevalence stats from Leap's corpus (e.g. "78% of Indian CS applicants to CMU open with a childhood frame").
- When a pattern shows up in the student's draft, reference it by stat. This is the core advantage of Leap Review over generic feedback — the student needs to know not just "this is weak" but "this is the same pattern 78% of your competition is using."
- Cite the stat naturally inside the verdict, the relevant score rationale, and the action plan items. Don't bolt it on — fold it in.
- Don't invent stats. Only use the ones provided.

You will respond by calling the emit_review tool.`;

export function buildScoringUserMessage(
  sopText: string,
  rubric: ProgramRubric,
  clicheMatches: DeterministicMatch[],
): string {
  const wordCount = sopText.trim().split(/\s+/).length;
  return `TARGET PROGRAM:
${rubric.programName} at ${rubric.university} (${rubric.country})

PROGRAM RUBRIC:
Dimensions and admitted-student medians (0-10):
${rubric.dimensions.map((d) => `  - ${d.key} (${d.label}): admitted median ${d.admittedMedian}, weight ${d.weight}`).join("\n")}

Things admitted SOPs to this program almost always have:
${rubric.expectations.map((e) => `  - ${e}`).join("\n")}

Common rejection patterns at this program:
${rubric.rejectionPatterns.map((p) => `  - ${p}`).join("\n")}

Indian-applicant patterns at this program (with prevalence from Leap's corpus — cite these by stat when they appear in the draft):
${rubric.indianApplicantPatterns.map((p) => `  - ${p}`).join("\n")}

Faculty / labs / courses worth referencing (used to detect "why-program" specificity):
  - Faculty: ${rubric.facultyHints.join(", ")}
  - Courses: ${rubric.courseHints.join(", ")}
  - Research areas: ${rubric.researchHints.join(", ")}

Word target for this program: ${rubric.wordTarget.min}-${rubric.wordTarget.max} words.

CLICHÉS ALREADY DETECTED (by deterministic pre-pass, do not re-flag):
${
  clicheMatches.length === 0
    ? "  (none)"
    : clicheMatches
        .map(
          (m) =>
            `  - "${m.phrase}" [${m.category}] — ${m.why}`,
        )
        .join("\n")
}

SOP TEXT (${wordCount} words):
"""
${sopText}
"""

Score the SOP against the rubric, identify missing expectations, write a one-line verdict directed at the student, and a 3-bullet action plan they can work on tonight. Call emit_review.`;
}

export const scoringToolSchema = {
  name: "emit_review",
  description: "Emit the structured review for the SOP.",
  input_schema: {
    type: "object" as const,
    properties: {
      overallBand: {
        type: "string",
        enum: ["weak", "average", "strong"],
        description:
          "weak = below admitted baseline on most dimensions; average = at baseline on most; strong = at or above baseline on most",
      },
      verdict: {
        type: "string",
        description:
          "One-line honest verdict spoken to the student. Concrete and specific, not generic. Example: 'Your technical depth is real and your why-CMU paragraph names the right things, but your opening is the same childhood-passion frame 70% of Indian CS applicants use — that's the first thing to rewrite.'",
      },
      asIsPercentile: {
        type: "integer",
        minimum: 1,
        maximum: 99,
        description:
          "Where this draft sits AS-IS among Indian applicants to this program who got admitted last cycle. 50 = at the median admit.",
      },
      withFixesPercentile: {
        type: "integer",
        minimum: 1,
        maximum: 99,
        description:
          "Where the draft would land after the action plan is executed well. Must be >= asIsPercentile.",
      },
      percentileStatement: {
        type: "string",
        description:
          "One sentence in plain English connecting the two percentiles. Example: 'As-is, this draft is in the bottom 35% of Indian CS applicants admitted to CMU MSCS last cycle — the action plan would move it to the median.'",
      },
      scores: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              enum: [
                "opening_hook",
                "why_program",
                "technical_specificity",
                "narrative_arc",
                "voice",
                "structure",
              ],
            },
            score: { type: "integer", minimum: 0, maximum: 10 },
            rationale: {
              type: "string",
              description:
                "One sentence on what drove the score, citing specific aspects of the SOP.",
            },
          },
          required: ["key", "score", "rationale"],
        },
      },
      missingItems: {
        type: "array",
        minItems: 4,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              description: "An expectation from the rubric, in plain language.",
            },
            present: {
              type: "boolean",
              description: "Whether this expectation is met in the SOP.",
            },
          },
          required: ["label", "present"],
        },
      },
      actionPlan: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        description:
          "Exactly 3 things the student should do next, in priority order. Each item is a single concrete action they can finish tonight. Written in second person, warm but direct, no hedging. Reference specific paragraphs or phrases from THIS SOP — never generic advice.",
        items: {
          type: "object",
          properties: {
            action: {
              type: "string",
              description:
                "The action itself, in one short sentence. Example: 'Rewrite your opening paragraph — replace the childhood story with the specific moment from your Flipkart project that you mention later.'",
            },
            why: {
              type: "string",
              description:
                "One sentence on why this is the highest-leverage change for this draft.",
            },
          },
          required: ["action", "why"],
        },
      },
    },
    required: [
      "overallBand",
      "asIsPercentile",
      "withFixesPercentile",
      "percentileStatement",
      "verdict",
      "scores",
      "missingItems",
      "actionPlan",
    ],
  },
};

// ── Stage 3 ────────────────────────────────────────────────

export const annotationSystemPrompt = `You are the Annotation pass of Leap Review's pipeline. Your job is to identify specific phrases in the SOP that triggered the issues already scored by Stage 2.

You will be given:
- The SOP text
- The dimension scores from Stage 2
- The list of clichés already detected (do NOT re-flag these — they're handled separately)

Your job is to surface the 3-6 most important non-cliché issues — vague claims, missing program hooks, tone mismatches, weak opening that wasn't a known cliché, or generic flattery patterns the cliché scanner missed.

For each issue, you must:
1. Quote the EXACT phrase from the SOP (must be a verbatim substring — no paraphrasing)
2. Categorize it
3. Set severity (high = likely to materially hurt admissions, medium = noticeable, low = minor polish)
4. Write a one-sentence "why this matters" that's specific to the phrase

Quality bar: only flag the issues a counselor would actually want to discuss with the student. Don't flag things just because you can.

You will respond by calling the emit_annotations tool.`;

export function buildAnnotationUserMessage(
  sopText: string,
  scoreSummary: string,
  clicheMatches: DeterministicMatch[],
): string {
  return `STAGE 2 SCORES:
${scoreSummary}

CLICHÉS ALREADY FLAGGED (do not re-flag these phrases):
${
  clicheMatches.length === 0
    ? "  (none)"
    : clicheMatches.map((m) => `  - "${m.phrase}"`).join("\n")
}

SOP TEXT:
"""
${sopText}
"""

Identify 3-6 specific phrases in the SOP that represent the most important non-cliché issues. Each phrase must be a verbatim substring of the SOP. Call emit_annotations.`;
}

export const annotationToolSchema = {
  name: "emit_annotations",
  description: "Emit span-level annotations for the SOP.",
  input_schema: {
    type: "object" as const,
    properties: {
      annotations: {
        type: "array",
        minItems: 0,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            phrase: {
              type: "string",
              description:
                "Exact verbatim substring from the SOP. Must match character-for-character.",
            },
            category: {
              type: "string",
              enum: [
                "vague-claim",
                "missing-program-hook",
                "tone-mismatch",
                "weak-opening",
                "generic-flattery",
              ],
            },
            severity: {
              type: "string",
              enum: ["low", "medium", "high"],
            },
            why: {
              type: "string",
              description:
                "One sentence on why this phrase is a problem at this specific program.",
            },
          },
          required: ["phrase", "category", "severity", "why"],
        },
      },
    },
    required: ["annotations"],
  },
};
