import type { Profile, UniversityRecord } from "./types";

export const systemPrompt = `You are the Outcome Intelligence Engine for Leap Scholar — an Indian study-abroad platform. You analyze student profiles against a curated university dataset and produce structured "Outcome Briefs" that predict admit, visa, employment, and ROI outcomes.

Your job is NOT to recommend "good universities." Your job is to predict, for THIS specific student, what will actually happen if they apply.

You must:
- Adjust each university's base rates up or down based on profile strength (GPA, test scores, work ex, IELTS, country of origin = India).
- Classify each recommendation as Reach / Target / Safety based on the adjusted admit probability (Reach < 25%, Target 25-60%, Safety > 60%).
- Compute total cost in INR (use 1 USD = 83 INR).
- Compute 2-year ROI as ((medianStartingSalaryUsd * 2) - (tuitionUsd + livingCostUsd)) / (tuitionUsd + livingCostUsd), expressed as a percentage.
- Pick 6 to 8 universities from the provided list ONLY. Do not invent schools. Mix Reach / Target / Safety.
- Surface 2-3 risk flags that are specific to THIS profile (not generic). Examples: "IELTS 6.5 is below the 7.0 threshold for top-10 UK programs — visa risk elevated", "Budget ceiling of ₹40L excludes all tier-1 US options after living cost".
- Write a one-line profile summary (e.g. "Strong CS undergrad with limited test scores, budget-constrained").
- Write a one-sentence verdict that positions the student honestly (e.g. "Competitive for tier-2 US CS and tier-1 UK; tier-1 US is a stretch without GRE retake").

Tone: Bloomberg terminal analyst, not marketing copy. Direct, quantitative, no hedging language like "consider" or "explore." Use "predicts" and "expects."

You will respond by calling the emit_brief tool with the structured Brief.`;

export function buildUserMessage(profile: Profile, universities: UniversityRecord[]): string {
  return `STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}

CANDIDATE UNIVERSITIES (use only these — do not invent):
${JSON.stringify(universities, null, 2)}

Generate the Outcome Brief by calling emit_brief.`;
}

// JSON schema for the tool the model must call.
export const briefToolSchema = {
  name: "emit_brief",
  description: "Emit the structured Outcome Brief for the student.",
  input_schema: {
    type: "object" as const,
    properties: {
      profileSummary: { type: "string", description: "One-line characterization of the student" },
      verdict: { type: "string", description: "One-sentence honest positioning" },
      recommendations: {
        type: "array",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            universityId: { type: "string" },
            name: { type: "string" },
            country: { type: "string" },
            program: { type: "string" },
            admitProbability: { type: "number", minimum: 0, maximum: 1 },
            visaApprovalRate: { type: "number", minimum: 0, maximum: 1 },
            employmentRateWithin6Mo: { type: "number", minimum: 0, maximum: 1 },
            medianStartingSalaryUsd: { type: "number" },
            twoYearRoiPct: { type: "number" },
            totalCostInr: { type: "number" },
            fitBand: { type: "string", enum: ["Reach", "Target", "Safety"] },
            rationale: { type: "string" },
          },
          required: [
            "universityId",
            "name",
            "country",
            "program",
            "admitProbability",
            "visaApprovalRate",
            "employmentRateWithin6Mo",
            "medianStartingSalaryUsd",
            "twoYearRoiPct",
            "totalCostInr",
            "fitBand",
            "rationale",
          ],
        },
      },
      risks: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["low", "medium", "high"] },
            title: { type: "string" },
            detail: { type: "string" },
          },
          required: ["severity", "title", "detail"],
        },
      },
    },
    required: ["profileSummary", "verdict", "recommendations", "risks"],
  },
};
