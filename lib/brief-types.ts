// The shape of the final Outcome Brief returned by the API.

import type { ProgramScore, RiskFlag } from "./scoring";
import type { StudentProfile } from "./profile";

export interface EdgeMove {
  // e.g. "TU Munich — same outcome, 1/12th the cost"
  headline: string;
  // 2-3 sentences of honest reasoning
  body: string;
  // Optional: reference a universityId from the dataset
  referenceUniversityId?: string;
  // Category for the accent color / icon
  kind: "alternate-bet" | "budget-trap" | "visa-reality" | "cost-hack";
}

export interface ActionItem {
  priority: number; // 1 is highest
  action: string; // imperative
  why: string; // 1-2 sentence rationale
}

export interface ComparableStudent {
  initials: string; // "A.M."
  profileSummary: string; // "7.3 CGPA · Tier-2 · GRE 318 · 1yr Indian startup"
  appliedTo: string; // "CMU MSCS"
  outcome: "admitted" | "rejected" | "waitlisted";
  thenWhatHappened: string; // "Works at Stripe SF, H1-B in lottery, paid off 60% of loan"
}

export interface ProgramDrilldown {
  universityId: string;
  costBreakdown: {
    label: string;
    amountUSD: number;
  }[];
  comparableStudents: ComparableStudent[];
  rationale: string; // LLM-written, 3-4 sentences
}

export interface OutcomeBrief {
  // Provenance
  studentName?: string;
  generatedAt: string;
  profile: StudentProfile;

  // The honest headline
  verdict: string; // one sentence
  verdictBand: "strong-bet" | "mixed-bet" | "thin-bet" | "not-worth-it";

  // The main table
  portfolio: ProgramScore[];

  // The non-obvious recommendations — 2-4 of them
  edgeMoves: EdgeMove[];

  // Profile-specific warnings
  riskFlags: RiskFlag[];

  // Top 3 things to do next
  actionPlan: ActionItem[];

  // Per-program drilldown — keyed by universityId
  drilldowns: Record<string, ProgramDrilldown>;
}

export interface BriefRequest {
  profile: StudentProfile;
}

export interface BriefResponse {
  brief: OutcomeBrief;
  latencyMs: number;
  fromCache: boolean;
}
