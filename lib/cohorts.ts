// Synthetic comparable-student generator for the per-program drilldown.
//
// In production this would query Leap's outcome warehouse for actual nearest
// neighbors. For the prototype we generate deterministic-per-profile pseudo
// cohorts that feel real: plausible initials, profile summaries in the same
// bucket as the applicant, realistic admit/reject/waitlist split based on
// the scored admit probability, and plausible 2-years-later outcomes.

import type { StudentProfile } from "./profile";
import type { University } from "./universities";
import type { ComparableStudent } from "./brief-types";

const FIRST_INITIALS = ["A", "R", "S", "K", "P", "N", "D", "M", "V", "T", "J", "H"];
const LAST_INITIALS = ["M", "S", "K", "P", "R", "G", "J", "V", "B", "N", "T", "D"];

export function generateComparableCohort(
  profile: StudentProfile,
  u: University,
  admitProb: number,
): ComparableStudent[] {
  const rng = makeRng(`${profile.cgpa}-${profile.collegeTier}-${u.id}`);
  const showN = 3;

  // Distribute the 3 shown between admitted / rejected / waitlisted
  // in a way that respects the underlying probability.
  const outcomes: ComparableStudent["outcome"][] = [];
  if (admitProb >= 0.4) {
    outcomes.push("admitted", "admitted", "rejected");
  } else if (admitProb >= 0.2) {
    outcomes.push("admitted", "rejected", "waitlisted");
  } else if (admitProb >= 0.08) {
    outcomes.push("admitted", "rejected", "rejected");
  } else {
    outcomes.push("rejected", "rejected", "rejected");
  }

  const students: ComparableStudent[] = [];
  for (let i = 0; i < showN; i++) {
    students.push(buildStudent(rng, profile, u, outcomes[i]));
  }
  return students;
}

function buildStudent(
  rng: () => number,
  profile: StudentProfile,
  u: University,
  outcome: ComparableStudent["outcome"],
): ComparableStudent {
  const initials = `${pick(rng, FIRST_INITIALS)}.${pick(rng, LAST_INITIALS)}.`;

  // Jitter profile slightly to feel like neighbors, not clones
  const cgpa = clamp(profile.cgpa + (rng() - 0.5) * 0.4, 6.0, 10);
  const greNoise = profile.gre ? profile.gre + Math.round((rng() - 0.5) * 6) : 0;
  const years = Math.max(0, profile.workExperienceYears + (rng() > 0.7 ? 1 : 0));

  const tierLabel = {
    iit: "IIT",
    "nit-tier1": "NIT",
    "tier1-private": "BITS / IIIT-H",
    tier2: "Tier-2",
    tier3: "Tier-3",
  }[profile.collegeTier];

  const workLabel = {
    none: "fresher",
    "service-company": "TCS/Infy-type",
    "indian-startup": "Indian startup",
    "faang-or-similar": "FAANG-tier",
    "research-or-phd": "research lab",
  }[profile.workExperienceBucket];

  const greStr = greNoise ? ` · GRE ${greNoise}` : "";
  const workStr = years > 0 ? ` · ${years}yr ${workLabel}` : "";
  const profileSummary = `${cgpa.toFixed(1)} CGPA · ${tierLabel}${greStr}${workStr}`;

  const appliedTo = `${shortName(u)} ${shortProgram(u)}`;

  return {
    initials,
    profileSummary,
    appliedTo,
    outcome,
    thenWhatHappened: buildOutcomeNarrative(rng, u, outcome),
  };
}

function buildOutcomeNarrative(
  rng: () => number,
  u: University,
  outcome: ComparableStudent["outcome"],
): string {
  if (outcome === "rejected") {
    const alternates: Record<string, string[]> = {
      US: [
        "Pivoted to a Tier-2 US program, now at a mid-size Bay Area company, loan on track.",
        "Reapplied next cycle with a stronger GRE and got into a similar US program.",
        "Took a data role in Bengaluru, shelved the abroad plan for 2 years.",
      ],
      UK: [
        "Accepted a Manchester-tier UK offer instead, now at a London fintech.",
        "Stayed in India, joined a product startup, plans to reapply next year.",
      ],
      Canada: [
        "Pivoted to Ireland after Canada refusal — now based in Dublin.",
        "Waiting one cycle, applying to Germany instead.",
      ],
      Germany: [
        "Reapplied next cycle with slightly better German language prep, got in.",
      ],
      Ireland: ["Pivoted to the UK instead, London-based now."],
      Australia: ["Stayed in India, took a data role in Hyderabad."],
    };
    return pick(rng, alternates[u.country] ?? alternates.US);
  }

  if (outcome === "waitlisted") {
    return "Converted off waitlist 3 weeks before the deposit deadline, deferred once, now mid-program.";
  }

  // admitted
  const narratives: Record<string, string[]> = {
    US: [
      "Currently mid-program, summer internship at a US tech company, loan repayment plan on track.",
      "Graduated 2024, works at a Bay Area unicorn, repaid ~40% of the loan, H1-B in the lottery.",
      "Graduated 2024, works at a mid-size Seattle firm, still on OPT, loan on schedule.",
      "Still in program, secured summer internship at a FAANG through on-campus recruiting.",
    ],
    UK: [
      "Graduated 2024, converted to Skilled Worker visa at a London fintech, repaying loan on time.",
      "Currently on UK Graduate visa (2-year stay-back), job search going 6 months in.",
    ],
    Canada: [
      "Mid-program, the visa came through after a second attempt; summer internship in Toronto.",
    ],
    Germany: [
      "Graduated 2024, working at a Munich Tier-1 (automotive/tech), EU Blue Card pathway on track.",
      "Currently mid-program, thesis at a Berlin research lab, intends to stay in EU.",
    ],
    Ireland: [
      "Graduated 2024, now at a Dublin Big Tech EU HQ on the 2-year stay-back.",
    ],
    Australia: [
      "Graduated 2024, currently on 485 Graduate visa, working in Melbourne enterprise IT.",
    ],
  };
  return pick(rng, narratives[u.country] ?? narratives.US);
}

// ──────────────────────────────────────────────────────────────────────

export function buildCostBreakdown(u: University) {
  const years = u.durationYears;
  const tuition = Math.round(u.tuitionUSDPerYear * years);
  const living = Math.round(u.livingCostUSDPerYear * years);
  const travel = 2500;
  const insurance = Math.round(2000 * years);
  const buffer = 3000;
  return [
    { label: `Tuition (${years} ${years === 1 ? "yr" : "yrs"})`, amountUSD: tuition },
    { label: "Living + rent", amountUSD: living },
    { label: "Travel (return flights)", amountUSD: travel },
    { label: "Insurance + visa", amountUSD: insurance },
    { label: "Buffer / settling-in", amountUSD: buffer },
  ];
}

// ──────────────────────────────────────────────────────────────────────

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function shortName(u: University): string {
  // Compact the university name for display in a student card
  return u.university
    .replace("University of ", "")
    .replace(" University", "")
    .replace("Institute of Technology", "Tech")
    .replace("Technical ", "TU ")
    .replace(" College London", "")
    .replace("Massachusetts ", "M")
    .trim();
}

function shortProgram(u: University): string {
  if (u.programName.includes("MSCS") || u.programName.includes("MS in Computer Science"))
    return "MSCS";
  if (u.programName.includes("MSc in Computer Science")) return "MSc CS";
  if (u.programName.includes("Data Science")) return "DS";
  if (u.programName.includes("Machine Learning")) return "ML";
  if (u.programName.includes("Informatics")) return "Informatics";
  if (u.programName.includes("Artificial Intelligence")) return "AI";
  if (u.programName.includes("IT")) return "IT";
  if (u.programName.includes("Business Analytics")) return "BA";
  return "MS";
}

// Deterministic pseudo-rng from a seed string — keeps the cohort stable for
// a given profile+program pair so rerunning doesn't reshuffle the narrative.
function makeRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
