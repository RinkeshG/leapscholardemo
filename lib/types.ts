// Core domain types for the Outcome Brief prototype.

export type Country = "US" | "UK" | "Canada" | "Australia" | "Germany";

export type Field =
  | "Computer Science"
  | "Data Science"
  | "Business Analytics"
  | "MBA"
  | "Engineering";

export type DegreeLevel = "Masters" | "Bachelors";

export type GpaScale = "10" | "4";

export interface Profile {
  name: string;
  intake: string; // e.g. "Fall 2026"
  countries: Country[];
  field: Field;
  degree: DegreeLevel;
  gpa: number;
  gpaScale: GpaScale;
  greGmat?: number; // optional
  ielts: number; // 0-9
  workExperienceYears: number;
  budgetLakhs: number; // total cost ceiling in INR lakhs
}

export interface UniversityRecord {
  id: string;
  name: string;
  country: Country;
  city: string;
  program: string;
  field: Field;
  degree: DegreeLevel;
  baseAdmitRate: number; // 0-1
  baseVisaApprovalRate: number; // 0-1
  medianStartingSalaryUsd: number;
  employmentRateWithin6Mo: number; // 0-1
  tuitionUsd: number; // total program tuition
  livingCostUsd: number; // total program living
  tier: 1 | 2 | 3; // 1 = top, 3 = accessible
}

// What the LLM returns, parsed and validated.
export interface UniversityRecommendation {
  universityId: string;
  name: string;
  country: Country;
  program: string;
  admitProbability: number; // 0-1, adjusted for this profile
  visaApprovalRate: number; // 0-1
  employmentRateWithin6Mo: number; // 0-1
  medianStartingSalaryUsd: number;
  twoYearRoiPct: number; // (2yr post-grad earnings - total cost) / total cost
  totalCostInr: number; // tuition + living, converted
  fitBand: "Reach" | "Target" | "Safety";
  rationale: string; // one sentence
}

export interface RiskFlag {
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
}

export interface Brief {
  studentName: string;
  generatedAt: string; // ISO
  profileSummary: string; // one-line characterization
  verdict: string; // one-sentence positioning
  recommendations: UniversityRecommendation[];
  risks: RiskFlag[];
}

export interface GenerateBriefResponse {
  brief: Brief;
  source: "live" | "fixture";
}
