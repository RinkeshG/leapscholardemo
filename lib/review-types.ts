// Types for Leap Review — the SOP/application QA tool.

export type ProgramId = "cmu-mscs" | "tum-mscs" | "lbs-mba";

export interface ProgramRubricDimension {
  key: string;
  label: string;
  admittedMedian: number; // 0-10
  weight: number; // relative importance
}

export interface ProgramRubric {
  programId: ProgramId;
  programName: string;
  university: string;
  country: string;
  wordTarget: { min: number; max: number };
  dimensions: ProgramRubricDimension[];
  // Things admitted SOPs to this program almost always have.
  expectations: string[];
  // Common patterns in rejected SOPs.
  rejectionPatterns: string[];
  // Concrete things the model should look for as evidence of "why this program."
  facultyHints: string[];
  courseHints: string[];
  researchHints: string[];
  // Patterns specific to Indian applicants at THIS program, with prevalence
  // numbers from Leap's corpus (in this prototype: synthesized but plausible).
  // The model should reference these by stat when they appear.
  indianApplicantPatterns: string[];
}

export type FlagCategory =
  | "cliche"
  | "vague-claim"
  | "missing-program-hook"
  | "tone-mismatch"
  | "weak-opening"
  | "generic-flattery";

export type FlagSeverity = "low" | "medium" | "high";

export interface FlagAnnotation {
  start: number; // char offset into sopText
  end: number;
  phrase: string;
  category: FlagCategory;
  severity: FlagSeverity;
  why: string;
}

export interface DimensionScore {
  key: string;
  label: string;
  score: number; // 0-10
  admittedMedian: number;
  rationale: string;
}

export interface MissingItem {
  label: string;
  present: boolean;
}

export type OverallBand = "weak" | "average" | "strong";

export interface StageTiming {
  stage: string;
  ms: number;
}

export interface ActionItem {
  action: string;
  why: string;
}

export interface ReviewReport {
  programId: ProgramId;
  programName: string;
  university: string;
  generatedAt: string;
  studentName: string | null;
  wordCount: number;
  sopText: string; // echoed back so the UI can render annotations
  overallBand: OverallBand;
  // Where this draft sits among Indian applicants to this program who got
  // admitted in the most recent cycle. 50 = at the median admit. 30 = bottom
  // 30%. Lower is worse. (In production: derived from Leap's corpus.)
  asIsPercentile: number;
  // Where the draft would land if the student executes the action plan.
  withFixesPercentile: number;
  // One sentence connecting the two percentiles in plain English.
  percentileStatement: string;
  verdict: string;
  scores: DimensionScore[];
  flags: FlagAnnotation[];
  missingItems: MissingItem[];
  actionPlan: ActionItem[];
  stageTimings: StageTiming[];
}

export interface ReviewRequest {
  sopText: string;
  programId: ProgramId;
  studentName?: string;
}

export interface ReviewResponse {
  report: ReviewReport;
  latencyMs: number;
}
