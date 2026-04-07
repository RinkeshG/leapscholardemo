// Stress test for the Outcome Brief deterministic core.
//
// Runs 30 profile fixtures through buildPortfolio + computeRiskFlags +
// scoreProgram and checks invariants. Prints a summary table and a list
// of any violations or suspicious-looking results.
//
//   PATH=…/node/v22.17.0/bin:$PATH npx tsx scripts/stress-test.ts

import {
  buildPortfolio,
  computeRiskFlags,
  scoreProgram,
} from "../lib/scoring";
import type { ProgramScore } from "../lib/scoring";
import { UNIVERSITIES } from "../lib/universities";
import type { StudentProfile } from "../lib/profile";
import type { Country, ProgramField } from "../lib/universities";

interface Profile extends StudentProfile {
  label: string;
  archetype: string;
}

function p(label: string, archetype: string, o: Partial<StudentProfile>): Profile {
  return {
    label,
    archetype,
    cgpa: 7.5,
    collegeTier: "tier2",
    gre: null,
    toefl: null,
    workExperienceYears: 0,
    workExperienceBucket: "none",
    targetField: "cs",
    intent: "industry-stay-abroad",
    budgetUSDCap: 70000,
    loanFunded: true,
    preferredCountries: ["US"],
    ...o,
  };
}

// 30 fixtures. Spans archetype, country, budget, field, edge cases.
const FIXTURES: Profile[] = [
  // ── Strong-bet archetypes ─────────────────────────
  p("IIT-CS-FAANG-rich", "elite", {
    cgpa: 9.2, collegeTier: "iit", gre: 332, workExperienceYears: 2,
    workExperienceBucket: "faang-or-similar", budgetUSDCap: 120000,
    loanFunded: false, preferredCountries: ["US"],
  }),
  p("IIT-research-track", "elite", {
    cgpa: 9.0, collegeTier: "iit", gre: 328, workExperienceYears: 1,
    workExperienceBucket: "research-or-phd", intent: "research",
    budgetUSDCap: 100000, preferredCountries: ["US", "UK"],
  }),
  p("NIT-strong-allrounder", "strong", {
    cgpa: 8.8, collegeTier: "nit-tier1", gre: 322, workExperienceYears: 2,
    workExperienceBucket: "indian-startup", budgetUSDCap: 90000,
    preferredCountries: ["US", "Germany"],
  }),
  p("BITS-product-co", "strong", {
    cgpa: 8.6, collegeTier: "tier1-private", gre: 320, workExperienceYears: 1.5,
    workExperienceBucket: "indian-startup", budgetUSDCap: 80000,
    preferredCountries: ["US", "UK", "Canada"],
  }),

  // ── Mixed bets ────────────────────────────────────
  p("Tier2-mid-CGPA-no-GRE", "mixed", {
    cgpa: 7.4, collegeTier: "tier2", gre: null, workExperienceYears: 1,
    workExperienceBucket: "service-company", budgetUSDCap: 70000,
    preferredCountries: ["US", "UK", "Germany"],
  }),
  p("Tier2-decent-GRE", "mixed", {
    cgpa: 7.8, collegeTier: "tier2", gre: 318, workExperienceYears: 2,
    workExperienceBucket: "service-company", budgetUSDCap: 75000,
    preferredCountries: ["US"],
  }),
  p("NIT-no-work-no-GRE", "mixed", {
    cgpa: 8.2, collegeTier: "nit-tier1", gre: null, workExperienceYears: 0,
    workExperienceBucket: "none", budgetUSDCap: 65000,
    preferredCountries: ["US", "Canada"],
  }),

  // ── Thin / risky bets ─────────────────────────────
  p("Tier3-low-CGPA-loan", "risky", {
    cgpa: 6.8, collegeTier: "tier3", gre: null, workExperienceYears: 0,
    workExperienceBucket: "none", budgetUSDCap: 50000,
    preferredCountries: ["Canada"],
  }),
  p("Tier3-loan-Canada-only", "risky", {
    cgpa: 7.0, collegeTier: "tier3", gre: 305, workExperienceYears: 1,
    workExperienceBucket: "service-company", budgetUSDCap: 45000,
    preferredCountries: ["Canada"],
  }),
  p("Tier3-decent-GRE-US", "risky", {
    cgpa: 7.2, collegeTier: "tier3", gre: 320, workExperienceYears: 0,
    workExperienceBucket: "none", budgetUSDCap: 60000,
    preferredCountries: ["US"],
  }),

  // ── Tight-budget cases ────────────────────────────
  p("Tight-budget-15k", "budget-edge", {
    cgpa: 8.0, collegeTier: "nit-tier1", budgetUSDCap: 15000,
    preferredCountries: ["Germany", "Ireland"],
  }),
  p("Mid-budget-30k", "budget-edge", {
    cgpa: 7.6, collegeTier: "tier2", budgetUSDCap: 30000,
    preferredCountries: ["Germany"],
  }),
  p("OMSCS-target", "budget-edge", {
    cgpa: 7.5, collegeTier: "tier2", workExperienceYears: 2,
    workExperienceBucket: "service-company", budgetUSDCap: 25000,
    preferredCountries: ["US"],
  }),

  // ── Country-mix edge cases ────────────────────────
  p("Germany-only", "country-edge", {
    cgpa: 8.5, collegeTier: "nit-tier1", preferredCountries: ["Germany"],
  }),
  p("Ireland-only", "country-edge", {
    cgpa: 7.8, collegeTier: "tier2", preferredCountries: ["Ireland"],
  }),
  p("Australia-only", "country-edge", {
    cgpa: 7.5, collegeTier: "tier2", preferredCountries: ["Australia"],
  }),
  p("UK-only", "country-edge", {
    cgpa: 8.0, collegeTier: "tier1-private", preferredCountries: ["UK"],
  }),
  p("Canada-only-strong", "country-edge", {
    cgpa: 9.0, collegeTier: "iit", gre: 328, preferredCountries: ["Canada"],
  }),
  p("All-six-countries", "country-edge", {
    cgpa: 7.8, collegeTier: "tier2", gre: 320, preferredCountries: [
      "US", "UK", "Canada", "Germany", "Ireland", "Australia",
    ],
  }),

  // ── Field edge cases ──────────────────────────────
  p("Data-science-target", "field-edge", {
    cgpa: 8.0, collegeTier: "nit-tier1", gre: 318,
    targetField: "data-science", preferredCountries: ["US", "UK"],
  }),
  p("AI-ML-target", "field-edge", {
    cgpa: 8.5, collegeTier: "iit", gre: 325,
    targetField: "ai-ml", preferredCountries: ["US"],
  }),
  p("Business-analytics-target", "field-edge", {
    cgpa: 8.0, collegeTier: "tier1-private", gre: 320,
    targetField: "business-analytics", preferredCountries: ["UK", "US"],
  }),
  p("Management-target", "field-edge", {
    cgpa: 8.0, collegeTier: "iit", gre: 325,
    targetField: "management", preferredCountries: ["US", "UK"],
  }),

  // ── CGPA boundary ─────────────────────────────────
  p("CGPA-4-floor", "boundary", {
    cgpa: 4.0, collegeTier: "tier3", preferredCountries: ["Germany"],
  }),
  p("CGPA-10-ceiling", "boundary", {
    cgpa: 10.0, collegeTier: "iit", gre: 340,
    workExperienceBucket: "research-or-phd", workExperienceYears: 3,
    budgetUSDCap: 200000, preferredCountries: ["US"],
  }),
  p("CGPA-7-no-GRE-self-funded", "boundary", {
    cgpa: 7.0, collegeTier: "tier2", loanFunded: false,
    budgetUSDCap: 150000, preferredCountries: ["US", "UK"],
  }),

  // ── Intent variations ─────────────────────────────
  p("Industry-return-intent", "intent", {
    cgpa: 8.0, collegeTier: "tier1-private", gre: 320,
    intent: "industry-return", preferredCountries: ["US", "UK"],
  }),
  p("Undecided-intent", "intent", {
    cgpa: 7.5, collegeTier: "tier2", intent: "undecided",
    preferredCountries: ["US", "Germany"],
  }),

  // ── Massive work experience ───────────────────────
  p("Senior-FAANG-7yr", "senior", {
    cgpa: 8.0, collegeTier: "tier1-private", gre: 322,
    workExperienceYears: 7, workExperienceBucket: "faang-or-similar",
    budgetUSDCap: 100000, intent: "industry-stay-abroad",
    preferredCountries: ["US"],
  }),
  p("Senior-service-5yr", "senior", {
    cgpa: 7.4, collegeTier: "tier2", workExperienceYears: 5,
    workExperienceBucket: "service-company", budgetUSDCap: 60000,
    preferredCountries: ["US", "Canada"],
  }),
];

interface Issue {
  fixture: string;
  severity: "ERROR" | "WARN" | "INFO";
  message: string;
}
const issues: Issue[] = [];

function flag(fixture: string, severity: Issue["severity"], message: string) {
  issues.push({ fixture, severity, message });
}

function isFinite01(x: number): boolean {
  return Number.isFinite(x) && x >= 0 && x <= 1;
}

function checkInvariants(fix: Profile, portfolio: ProgramScore[]) {
  // 1. Portfolio not empty (warn)
  if (portfolio.length === 0) {
    flag(fix.label, "ERROR", "Empty portfolio — API would 400");
    return;
  }
  // 2. All probabilities in [0,1]
  for (const s of portfolio) {
    if (!isFinite01(s.admitProbability))
      flag(fix.label, "ERROR", `${s.university.id}: admit out of range = ${s.admitProbability}`);
    if (!isFinite01(s.visaProbability))
      flag(fix.label, "ERROR", `${s.university.id}: visa out of range = ${s.visaProbability}`);
    if (!isFinite01(s.landedProbability))
      flag(fix.label, "ERROR", `${s.university.id}: landed out of range = ${s.landedProbability}`);
    if (!Number.isFinite(s.totalCostUSD) || s.totalCostUSD <= 0)
      flag(fix.label, "ERROR", `${s.university.id}: bad cost = ${s.totalCostUSD}`);
    if (!Number.isFinite(s.netROI))
      flag(fix.label, "ERROR", `${s.university.id}: bad ROI = ${s.netROI}`);
    if (!Number.isFinite(s.fiveYearEarningsUSD) || s.fiveYearEarningsUSD < 0)
      flag(fix.label, "ERROR", `${s.university.id}: bad 5yr earnings = ${s.fiveYearEarningsUSD}`);
  }

  // 3. Fit-band consistency: visa<0.35 → must be skip
  for (const s of portfolio) {
    if (s.visaProbability < 0.35 && s.fitBand !== "skip") {
      flag(fix.label, "ERROR", `${s.university.id}: visa ${s.visaProbability} < 0.35 but fit=${s.fitBand}`);
    }
  }

  // 4. landed = admit × visa (within rounding)
  for (const s of portfolio) {
    const expected = s.admitProbability * s.visaProbability;
    if (Math.abs(expected - s.landedProbability) > 0.01) {
      flag(fix.label, "ERROR",
        `${s.university.id}: landed mismatch ${s.landedProbability} vs ${expected.toFixed(3)}`);
    }
  }

  // 5. Country preferences mostly respected (allow 1 leak)
  const prefSet = new Set(fix.preferredCountries);
  const leaks = portfolio.filter((s) => !prefSet.has(s.university.country));
  if (leaks.length > 1) {
    flag(fix.label, "WARN", `${leaks.length} leaks outside preferred countries`);
  }

  // 6. Portfolio size
  if (portfolio.length > 8) {
    flag(fix.label, "WARN", `Portfolio has ${portfolio.length} programs (>8)`);
  }
  if (portfolio.length < 4) {
    flag(fix.label, "WARN", `Portfolio thin: only ${portfolio.length} programs`);
  }

  // 7. Profile adjustments missing
  for (const s of portfolio) {
    if (s.profileAdjustments.length === 0 && s.university.id !== "gatech-omscs") {
      flag(fix.label, "INFO", `${s.university.id}: no profile adjustments shown to user`);
    }
  }

  // 8. Sort order: bands should be safety→target→reach→skip
  // (accessible-tier rows are intentionally pushed to the bottom as a "cost hack",
  // so they're exempt from band ordering)
  const order = { safety: 0, target: 1, reach: 2, skip: 3 } as const;
  let prev = -1;
  for (const s of portfolio) {
    if (s.university.tierTag === "accessible") continue;
    const cur = order[s.fitBand];
    if (cur < prev) {
      flag(fix.label, "ERROR", `Out-of-order fit bands at ${s.university.id}`);
    }
    prev = cur;
  }

  // 9. All-skip portfolios are a UX problem
  const allSkip = portfolio.every((s) => s.fitBand === "skip");
  if (allSkip) {
    flag(fix.label, "WARN", "Every program is Skip — verdict may be incoherent");
  }

  // 10. Budget catastrophes
  const overBudget = portfolio.filter((s) => !s.withinBudget);
  if (overBudget.length === portfolio.length) {
    flag(fix.label, "WARN", "Every program is over budget");
  }

  // 11. Cohort size sanity
  for (const s of portfolio) {
    if (!Number.isFinite(s.cohortSizeApprox) || s.cohortSizeApprox <= 0) {
      flag(fix.label, "ERROR", `${s.university.id}: bad cohort size ${s.cohortSizeApprox}`);
    }
  }

  // 12. Loan burden in [0,1]
  for (const s of portfolio) {
    if (!isFinite01(s.loanBurdenScore)) {
      flag(fix.label, "ERROR", `${s.university.id}: bad loan burden ${s.loanBurdenScore}`);
    }
  }
}

// Run
console.log("\n══════════════════════════════════════════════════════════════");
console.log(" LEAP INTELLIGENCE — STRESS TEST");
console.log(" 30 profiles × 30 programs × deterministic scorer");
console.log("══════════════════════════════════════════════════════════════\n");

const summary: {
  label: string;
  size: number;
  bands: string;
  topPick: string;
  topLanded: number;
  topROI: number;
  flagCount: number;
}[] = [];

for (const fix of FIXTURES) {
  let portfolio: ProgramScore[];
  try {
    portfolio = buildPortfolio(fix);
  } catch (e) {
    flag(fix.label, "ERROR", `buildPortfolio threw: ${(e as Error).message}`);
    continue;
  }

  checkInvariants(fix, portfolio);

  let flags: ReturnType<typeof computeRiskFlags>;
  try {
    flags = computeRiskFlags(fix, portfolio);
  } catch (e) {
    flag(fix.label, "ERROR", `computeRiskFlags threw: ${(e as Error).message}`);
    flags = [];
  }

  const bandCounts: Record<string, number> = {};
  for (const s of portfolio) bandCounts[s.fitBand] = (bandCounts[s.fitBand] ?? 0) + 1;
  const bandStr = ["safety", "target", "reach", "skip"]
    .map((b) => `${b[0].toUpperCase()}${bandCounts[b] ?? 0}`)
    .join(" ");

  const top = portfolio[0];
  summary.push({
    label: fix.label,
    size: portfolio.length,
    bands: bandStr,
    topPick: top ? `${top.university.id}` : "—",
    topLanded: top ? Math.round(top.landedProbability * 100) : 0,
    topROI: top ? Math.round(top.netROI * 100) : 0,
    flagCount: flags.length,
  });
}

// Print summary table
console.log("PROFILE                            SIZE  BANDS         TOP PICK              LAND%  ROI%  FLAGS");
console.log("─────────────────────────────────  ────  ────────────  ───────────────────  ─────  ────  ─────");
for (const r of summary) {
  console.log(
    `${r.label.padEnd(33)}  ${String(r.size).padStart(4)}  ${r.bands.padEnd(12)}  ${r.topPick.padEnd(19)}  ${String(r.topLanded).padStart(5)}  ${String(r.topROI).padStart(4)}  ${String(r.flagCount).padStart(5)}`,
  );
}

// Print issues
console.log("\n══════════════════════════════════════════════════════════════");
console.log(" INVARIANT VIOLATIONS / WARNINGS");
console.log("══════════════════════════════════════════════════════════════\n");
const errors = issues.filter((i) => i.severity === "ERROR");
const warns = issues.filter((i) => i.severity === "WARN");
const infos = issues.filter((i) => i.severity === "INFO");
console.log(`ERRORS: ${errors.length}   WARNINGS: ${warns.length}   INFO: ${infos.length}\n`);

for (const i of [...errors, ...warns, ...infos]) {
  const tag =
    i.severity === "ERROR"
      ? "✗"
      : i.severity === "WARN"
        ? "!"
        : "·";
  console.log(`  ${tag} [${i.severity}] ${i.fixture}: ${i.message}`);
}

// ──────────────────────────────────────────────────────────────────────
// Cross-check the dataset itself
// ──────────────────────────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════════════════════════");
console.log(" DATASET SANITY");
console.log("══════════════════════════════════════════════════════════════\n");

const fieldCounts: Record<string, number> = {};
for (const u of UNIVERSITIES) {
  fieldCounts[u.field] = (fieldCounts[u.field] ?? 0) + 1;
}
console.log("Programs by field:");
for (const [k, v] of Object.entries(fieldCounts)) console.log(`  ${k}: ${v}`);

const countryCounts: Record<string, number> = {};
for (const u of UNIVERSITIES) {
  countryCounts[u.country] = (countryCounts[u.country] ?? 0) + 1;
}
console.log("\nPrograms by country:");
for (const [k, v] of Object.entries(countryCounts)) console.log(`  ${k}: ${v}`);

// Surface any out-of-range dataset values
let datasetIssues = 0;
for (const u of UNIVERSITIES) {
  if (u.baselineAdmitRate < 0 || u.baselineAdmitRate > 1) {
    console.log(`  ✗ ${u.id}: baselineAdmitRate=${u.baselineAdmitRate}`);
    datasetIssues++;
  }
  if (u.visaApprovalRateIndia < 0 || u.visaApprovalRateIndia > 1) {
    console.log(`  ✗ ${u.id}: visaApprovalRateIndia=${u.visaApprovalRateIndia}`);
    datasetIssues++;
  }
  if (u.tuitionUSDPerYear < 0 || u.tuitionUSDPerYear > 200000) {
    console.log(`  ✗ ${u.id}: tuitionUSDPerYear=${u.tuitionUSDPerYear}`);
    datasetIssues++;
  }
  if (u.medianStartingSalaryUSD < 10000) {
    console.log(`  ✗ ${u.id}: salary=${u.medianStartingSalaryUSD}`);
    datasetIssues++;
  }
}
if (datasetIssues === 0) console.log("\n  Dataset values all within expected ranges ✓");

// Distribution of fit bands across full universe for a "median Indian
// applicant" — a sanity check that we're not skip-everything by default
const median: StudentProfile = {
  cgpa: 7.8,
  collegeTier: "tier2",
  gre: 318,
  toefl: null,
  workExperienceYears: 1,
  workExperienceBucket: "indian-startup",
  targetField: "cs",
  intent: "industry-stay-abroad",
  budgetUSDCap: 70000,
  loanFunded: true,
  preferredCountries: ["US", "UK", "Canada", "Germany", "Ireland", "Australia"],
};
const allScored = UNIVERSITIES.map((u) => scoreProgram(median, u));
const medianBands: Record<string, number> = {};
for (const s of allScored) medianBands[s.fitBand] = (medianBands[s.fitBand] ?? 0) + 1;
console.log("\nFit band distribution for the 'median Indian applicant' across ALL 30 programs:");
for (const [k, v] of Object.entries(medianBands)) console.log(`  ${k}: ${v}`);
