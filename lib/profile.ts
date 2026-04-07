// The student profile. 9 fields. Every one of them moves the scoring needle.
// Counselors fill out 40-field forms and then ignore 35 of them. We ask the
// 9 that matter.

import type { Country, ProgramField } from "./universities";

export type CollegeTier =
  | "iit"
  | "nit-tier1"
  | "tier1-private" // BITS, IIIT-H, VIT, etc.
  | "tier2"
  | "tier3";

export type WorkExperienceBucket =
  | "none"
  | "service-company" // TCS, Infosys, Wipro, Cognizant
  | "indian-startup"
  | "faang-or-similar"
  | "research-or-phd";

export type Intent =
  | "research" // plans PhD or lab work
  | "industry-stay-abroad" // wants to land + stay in the country
  | "industry-return" // wants the credential, plans to come back
  | "undecided";

export interface StudentProfile {
  // Academic
  cgpa: number; // on 10 scale
  collegeTier: CollegeTier;

  // Standardized
  gre: number | null; // 260–340, null if not taken
  toefl: number | null; // 0–120, null if IELTS

  // Work
  workExperienceYears: number;
  workExperienceBucket: WorkExperienceBucket;

  // Intent
  targetField: ProgramField;
  intent: Intent;

  // Constraints
  budgetUSDCap: number; // total affordable spend including loan
  loanFunded: boolean; // is the family borrowing for this?
  preferredCountries: Country[];

  // Soft
  studentName?: string;
}

export function profileSummary(p: StudentProfile): string {
  const tierLabel = COLLEGE_TIER_LABEL[p.collegeTier];
  const workLabel = WORK_BUCKET_LABEL[p.workExperienceBucket];
  const parts = [
    `${p.cgpa.toFixed(1)} CGPA`,
    tierLabel,
    p.gre ? `GRE ${p.gre}` : "no GRE",
    p.workExperienceYears > 0
      ? `${p.workExperienceYears} yr ${workLabel}`
      : "no work exp",
  ];
  return parts.join(" · ");
}

export const COLLEGE_TIER_LABEL: Record<CollegeTier, string> = {
  iit: "IIT",
  "nit-tier1": "NIT / top government",
  "tier1-private": "BITS / IIIT-H / top private",
  tier2: "Tier-2 engineering",
  tier3: "Tier-3 engineering",
};

export const WORK_BUCKET_LABEL: Record<WorkExperienceBucket, string> = {
  none: "no work experience",
  "service-company": "service company",
  "indian-startup": "Indian startup",
  "faang-or-similar": "FAANG-tier",
  "research-or-phd": "research / publications",
};

export const INTENT_LABEL: Record<Intent, string> = {
  research: "Research / PhD track",
  "industry-stay-abroad": "Land a job and stay abroad",
  "industry-return": "Get the credential, come back to India",
  undecided: "Still figuring it out",
};

export const FIELD_LABEL: Record<ProgramField, string> = {
  cs: "Computer Science",
  "data-science": "Data Science",
  "ai-ml": "AI / Machine Learning",
  "business-analytics": "Business Analytics",
  management: "Management / MBA",
};
