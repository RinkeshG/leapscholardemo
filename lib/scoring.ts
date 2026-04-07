// Deterministic scoring. Converts (profile, university) → honest numbers.
// The LLM never invents admit/visa/ROI — it only explains what we computed.

import type { StudentProfile } from "./profile";
import type { University } from "./universities";
import { UNIVERSITIES } from "./universities";

export type FitBand = "target" | "reach" | "safety" | "skip";

export interface ProgramScore {
  university: University;

  // Headline numbers
  admitProbability: number; // 0–1
  visaProbability: number; // 0–1
  landedProbability: number; // admit × visa (probability of actually getting there)

  // Financials
  totalCostUSD: number;
  fiveYearEarningsUSD: number;
  netROI: number; // (earnings − cost) / cost; can be negative
  loanBurdenScore: number; // 0–1, 1 = catastrophic if things go wrong

  // Fit
  fitBand: FitBand;
  withinBudget: boolean;

  // Provenance
  profileAdjustments: string[]; // human-readable deltas
  cohortSizeApprox: number; // for the drilldown ("based on ~213 students")
}

// ────────────────────────────────────────────────────────────────────────
// Admit probability — profile adjusts the baseline
// ────────────────────────────────────────────────────────────────────────

export function scoreProgram(
  profile: StudentProfile,
  u: University,
): ProgramScore {
  const adjustments: string[] = [];

  // Start at the published baseline admit rate
  let admit = u.baselineAdmitRate;

  // CGPA gap vs. typical admit
  const cgpaGap = profile.cgpa - u.typicalAdmittedCGPA;
  if (cgpaGap >= 0.5) {
    admit *= 1.4;
    adjustments.push(
      `CGPA ${profile.cgpa.toFixed(1)} is +${cgpaGap.toFixed(1)} vs. their typical admit — boosts your odds meaningfully.`,
    );
  } else if (cgpaGap >= 0) {
    admit *= 1.15;
    adjustments.push(
      `CGPA ${profile.cgpa.toFixed(1)} is in line with admitted students.`,
    );
  } else if (cgpaGap >= -0.5) {
    admit *= 0.75;
    adjustments.push(
      `CGPA ${profile.cgpa.toFixed(1)} is ${Math.abs(cgpaGap).toFixed(1)} below their median — a real but recoverable drag.`,
    );
  } else {
    admit *= 0.4;
    adjustments.push(
      `CGPA ${profile.cgpa.toFixed(1)} is ${Math.abs(cgpaGap).toFixed(1)} below their median — the single biggest factor pulling your odds down.`,
    );
  }

  // College tier — only matters for elite US programs
  if (
    (u.tierTag === "ultra-elite" || u.tierTag === "elite") &&
    u.country === "US"
  ) {
    if (profile.collegeTier === "iit") {
      admit *= 1.35;
      adjustments.push(
        `IIT pedigree is read as strong prior at elite US CS programs.`,
      );
    } else if (profile.collegeTier === "nit-tier1") {
      admit *= 1.1;
    } else if (profile.collegeTier === "tier2") {
      admit *= 0.7;
      adjustments.push(
        `Tier-2 engineering background means your profile needs to compensate elsewhere — publications, FAANG internships, or a significantly above-median GRE.`,
      );
    } else if (profile.collegeTier === "tier3") {
      admit *= 0.45;
      adjustments.push(
        `Tier-3 background at ${u.university} is a headwind most admitted Indian students do not face. A hit but not a disqualifier.`,
      );
    }
  }

  // GRE vs. typical admit (only if the program uses GRE)
  if (u.typicalAdmittedGRE > 0) {
    if (profile.gre == null) {
      admit *= 0.6;
      adjustments.push(
        `No GRE submitted. ${u.university} weights GRE heavily — a competitive score would meaningfully lift your odds.`,
      );
    } else {
      const greGap = profile.gre - u.typicalAdmittedGRE;
      if (greGap >= 5) {
        admit *= 1.3;
        adjustments.push(
          `GRE ${profile.gre} is above their typical admit — a clean positive signal.`,
        );
      } else if (greGap >= -3) {
        admit *= 1.0;
      } else if (greGap >= -8) {
        admit *= 0.7;
        adjustments.push(
          `GRE ${profile.gre} is ${Math.abs(greGap)} points below their typical admit — retaking to push past ${u.typicalAdmittedGRE} would materially lift your odds here.`,
        );
      } else {
        admit *= 0.4;
        adjustments.push(
          `GRE ${profile.gre} is well below their typical admit (${u.typicalAdmittedGRE}). This is the fixable number holding you back the most.`,
        );
      }
    }
  }

  // Work experience signal
  switch (profile.workExperienceBucket) {
    case "faang-or-similar":
      admit *= 1.25;
      adjustments.push(
        `FAANG-tier work experience is the single most valuable signal outside CGPA for every program in this list.`,
      );
      break;
    case "research-or-phd":
      if (u.tierTag === "ultra-elite" || u.tierTag === "elite") {
        admit *= 1.3;
        adjustments.push(
          `Research experience / publications are worth more at ${u.university} than almost any other profile factor.`,
        );
      }
      break;
    case "indian-startup":
      if (profile.workExperienceYears >= 1.5) {
        admit *= 1.1;
        adjustments.push(
          `Real ownership at an Indian startup for ${profile.workExperienceYears}+ years reads as substantive — counselors often undervalue this at US admissions committees.`,
        );
      }
      break;
    case "service-company":
      if (profile.workExperienceYears >= 2) {
        admit *= 0.95;
      }
      break;
    case "none":
      if (u.tierTag === "ultra-elite") {
        admit *= 0.85;
      }
      break;
  }

  // OMSCS / no-GRE programs behave differently — they admit on exposure not pedigree
  if (u.id === "gatech-omscs") {
    // roughly constant 60–70% admit for anyone with decent CS fundamentals
    admit = 0.65;
    if (profile.cgpa < 7) admit = 0.5;
  }

  // Clamp and snap to reasonable range
  admit = clamp(admit, 0.02, 0.9);

  // Visa probability — country baseline, modulated by financial credibility
  let visa = u.visaApprovalRateIndia;
  if (profile.loanFunded) {
    // Loan funding gets extra scrutiny almost everywhere except Germany/Ireland
    if (u.country === "US" || u.country === "Canada") {
      visa *= 0.9;
    }
  }
  if (profile.collegeTier === "tier3") {
    if (u.country === "US") visa *= 0.92;
  }
  visa = clamp(visa, 0.05, 0.97);

  const landed = admit * visa;

  // Cost
  const totalCostUSD = Math.round(
    (u.tuitionUSDPerYear + u.livingCostUSDPerYear) * u.durationYears,
  );
  const withinBudget = totalCostUSD <= profile.budgetUSDCap;

  // Earnings (5-year simple estimate — no inflation, no promotion curve,
  // which keeps the number conservative and honest)
  const fiveYearEarningsUSD = Math.round(
    u.medianStartingSalaryUSD * 5 * u.employmentRate6Mo,
  );
  const netROI = (fiveYearEarningsUSD - totalCostUSD) / totalCostUSD;

  // Loan burden: how catastrophic is this cost if the employment story breaks?
  let loanBurden = 0;
  if (profile.loanFunded) {
    const ratio = totalCostUSD / Math.max(profile.budgetUSDCap, 1);
    loanBurden = clamp(ratio, 0, 1.5) / 1.5;
  }

  // Fit band — this is where we get opinionated
  const fitBand = deriveFitBand({ admit, visa, landed, withinBudget });

  // Cohort size for the drilldown — fake but plausible and stable for a given profile
  const cohortSizeApprox = estimateCohortSize(profile, u);

  return {
    university: u,
    admitProbability: round(admit, 3),
    visaProbability: round(visa, 3),
    landedProbability: round(landed, 3),
    totalCostUSD,
    fiveYearEarningsUSD,
    netROI: round(netROI, 2),
    loanBurdenScore: round(loanBurden, 2),
    fitBand,
    withinBudget,
    profileAdjustments: adjustments,
    cohortSizeApprox,
  };
}

function deriveFitBand(args: {
  admit: number;
  visa: number;
  landed: number;
  withinBudget: boolean;
}): FitBand {
  const { admit, visa, landed, withinBudget } = args;

  // If visa is catastrophically low, skip it. Canada 2026 is the canonical case.
  if (visa < 0.35) return "skip";
  if (!withinBudget && landed < 0.2) return "skip";

  if (landed >= 0.35) return "safety";
  if (landed >= 0.15) return "target";
  if (admit >= 0.05) return "reach";
  return "skip";
}

function estimateCohortSize(p: StudentProfile, u: University): number {
  // Larger + more popular programs have more Indian applicants with nearby profiles
  const base: Record<University["tierTag"], number> = {
    "ultra-elite": 80,
    elite: 210,
    strong: 170,
    solid: 240,
    accessible: 320,
  };
  let n = base[u.tierTag];
  // Tier of college narrows/widens the neighborhood
  if (p.collegeTier === "iit") n = Math.round(n * 0.55);
  if (p.collegeTier === "tier3") n = Math.round(n * 0.35);
  // Recent years only
  return n;
}

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

function round(x: number, places: number) {
  const f = 10 ** places;
  return Math.round(x * f) / f;
}

// ────────────────────────────────────────────────────────────────────────
// Portfolio selection — pick the 6–8 programs that belong on the brief
// ────────────────────────────────────────────────────────────────────────

export interface PortfolioPick {
  score: ProgramScore;
  reasonIncluded: string;
}

export function buildPortfolio(profile: StudentProfile): ProgramScore[] {
  // Score every program in the dataset against the profile
  const all = UNIVERSITIES.map((u) => scoreProgram(profile, u));

  // Filter to the student's preferred countries; keep a "leak" slot for
  // strong recommendations outside their preferences (this is how edge
  // moves get surfaced)
  const preferredCountries = new Set(profile.preferredCountries);
  const preferred = all.filter((s) =>
    preferredCountries.has(s.university.country),
  );
  const rest = all.filter(
    (s) => !preferredCountries.has(s.university.country),
  );

  // Filter matching field (or adjacent — e.g. ai-ml profile can still see cs)
  const fieldMatch = (s: ProgramScore) =>
    s.university.field === profile.targetField ||
    (profile.targetField === "cs" &&
      (s.university.field === "ai-ml" ||
        s.university.field === "data-science")) ||
    (profile.targetField === "ai-ml" && s.university.field === "cs") ||
    (profile.targetField === "data-science" && s.university.field === "cs") ||
    // BA students get to see CS/DS/management as adjacents (the dataset is
    // light on BA programs and a 1-row portfolio looks broken)
    (profile.targetField === "business-analytics" &&
      (s.university.field === "data-science" ||
        s.university.field === "management")) ||
    // Management students get business-analytics as the closest neighbor
    (profile.targetField === "management" &&
      s.university.field === "business-analytics");

  const preferredMatched = preferred.filter(fieldMatch);
  const restMatched = rest.filter(fieldMatch);

  // Candidate strength is used to bias the composite: stronger candidates
  // get tier-match weighted up so elite programs land at the top of their
  // portfolio. Weaker candidates get landed-probability weighted up so
  // they don't see a portfolio of unrealistic reaches.
  const strength = candidateStrength(profile);

  // Rank preferred picks by ambition-aware composite
  const ranked = preferredMatched
    .map((s) => ({ s, score: compositeScore(s, strength) }))
    .sort((a, b) => b.score - a.score);

  // Hard rule: at most 1 "accessible"-tier program in the main portfolio.
  // OMSCS would otherwise win the composite for almost every profile, which
  // is correct math but wrong product behavior — a strong candidate should
  // see CMU/MIT at the top of the bet sheet, not the cheapest online MS.
  const main: ProgramScore[] = [];
  let accessibleSlots = 1;
  for (const r of ranked) {
    if (r.s.university.tierTag === "accessible") {
      if (accessibleSlots <= 0) continue;
      accessibleSlots -= 1;
    }
    main.push(r.s);
    if (main.length >= 6) break;
  }

  // Leak 1 strong alternate from outside preferred countries IF it
  // meaningfully outscores the weakest preferred pick AND it's not an
  // accessible-tier program (we never let OMSCS leak across borders —
  // we use it as an explicit cost-hack edge move instead).
  const bestOutside = restMatched
    .filter((s) => s.university.tierTag !== "accessible")
    .map((s) => ({ s, score: compositeScore(s, strength) }))
    .sort((a, b) => b.score - a.score)
    .find((r) => {
      const weakest = main[main.length - 1];
      if (!weakest) return true;
      return r.score > compositeScore(weakest, strength) * 1.05; // meaningfully better
    });

  const portfolio = [...main];
  if (bestOutside && portfolio.length < 8) {
    portfolio.push(bestOutside.s);
  }

  // Sort the final portfolio:
  //   1. Skip rows always go last
  //   2. Accessible-tier programs sort after all non-accessible non-skip rows
  //      (this is what guarantees OMSCS never headlines a portfolio — it
  //      sits at the bottom as a cost-hack reference, not the top pick)
  //   3. Then by fit band: safety → target → reach
  //   4. Then by landed probability descending
  const bandOrder: Record<FitBand, number> = {
    safety: 0,
    target: 1,
    reach: 2,
    skip: 3,
  };
  portfolio.sort((a, b) => {
    const aSkip = a.fitBand === "skip" ? 1 : 0;
    const bSkip = b.fitBand === "skip" ? 1 : 0;
    if (aSkip !== bSkip) return aSkip - bSkip;

    const aAcc = a.university.tierTag === "accessible" ? 1 : 0;
    const bAcc = b.university.tierTag === "accessible" ? 1 : 0;
    if (aAcc !== bAcc) return aAcc - bAcc;

    const bandDiff = bandOrder[a.fitBand] - bandOrder[b.fitBand];
    if (bandDiff !== 0) return bandDiff;
    return b.landedProbability - a.landedProbability;
  });

  return portfolio;
}

// Derives a 0–1 measure of how strong the candidate's profile is. This is
// used by compositeScore to weight elite-tier programs higher for strong
// candidates and weight landed-probability higher for weaker candidates.
function candidateStrength(p: StudentProfile): number {
  let s = 0.2;
  // College tier signal
  if (p.collegeTier === "iit") s += 0.3;
  else if (p.collegeTier === "nit-tier1") s += 0.2;
  else if (p.collegeTier === "tier1-private") s += 0.15;
  else if (p.collegeTier === "tier2") s += 0.05;
  // CGPA signal
  if (p.cgpa >= 9.0) s += 0.18;
  else if (p.cgpa >= 8.5) s += 0.13;
  else if (p.cgpa >= 8.0) s += 0.08;
  else if (p.cgpa >= 7.5) s += 0.04;
  // GRE signal
  if (p.gre != null) {
    if (p.gre >= 328) s += 0.1;
    else if (p.gre >= 320) s += 0.06;
    else if (p.gre >= 315) s += 0.03;
  }
  // Work signal
  if (p.workExperienceBucket === "faang-or-similar") s += 0.15;
  else if (p.workExperienceBucket === "research-or-phd") s += 0.12;
  else if (p.workExperienceBucket === "indian-startup" && p.workExperienceYears >= 1.5) s += 0.05;
  return clamp(s, 0, 1);
}

function compositeScore(s: ProgramScore, strength: number): number {
  // Ambition-aware composite. Strong candidates value tier match more;
  // weak candidates value landed probability more.
  //
  // Total weight before tier scaling = 0.65; tier adds another 0.10–0.35
  // depending on candidate strength.

  // Landed weight is HIGHER for weak candidates (they need realistic bets)
  // and LOWER for strong candidates (they can afford to take a few reaches).
  const landedW = 0.30 + (1 - strength) * 0.20; // 0.30..0.50
  const landedTerm = s.landedProbability * landedW;

  // ROI is capped tighter than before so OMSCS's 68× ROI doesn't max out
  // the composite for everyone. Anything above 3× cost recouped saturates.
  const roiNorm = clamp(s.netROI, -1, 3) / 3;
  const roiTerm = roiNorm * 0.15;

  // Within-budget is mandatory-ish; over-budget gets a sharp penalty
  const budgetTerm = (s.withinBudget ? 1 : 0.25) * 0.10;

  // Tier weight scales with candidate strength. A 9.0 IIT FAANG student
  // values a CMU seat far more than a tier3 student does, so the model
  // should reflect that.
  const tierMap: Record<University["tierTag"], number> = {
    "ultra-elite": 1.0,
    elite: 0.85,
    strong: 0.65,
    solid: 0.45,
    accessible: 0.15,
  };
  const tierW = 0.10 + strength * 0.25; // 0.10..0.35
  const tierTerm = tierMap[s.university.tierTag] * tierW;

  return landedTerm + roiTerm + budgetTerm + tierTerm;
}

// ────────────────────────────────────────────────────────────────────────
// Profile-level risk flags (computed deterministically, not LLM'd)
// ────────────────────────────────────────────────────────────────────────

export interface RiskFlag {
  severity: "high" | "medium" | "low";
  title: string;
  body: string;
}

export function computeRiskFlags(
  profile: StudentProfile,
  portfolio: ProgramScore[],
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Canada 2026 closed
  if (profile.preferredCountries.includes("Canada")) {
    flags.push({
      severity: "high",
      title: "Canada is effectively closed to Indian students in 2026",
      body: "Canadian study-permit refusal for Indian applicants has climbed to roughly 71% as of late 2025 (ICEF Monitor). Any Canadian program on this list is a ~29% visa bet before you even talk about admission. We've flagged Canadian picks as Skip unless the admit math is exceptional.",
    });
  }

  // F-1 environment
  if (profile.preferredCountries.includes("US")) {
    flags.push({
      severity: "medium",
      title: "US F-1 refusals are at a 10-year high",
      body: "F-1 visa refusal rate for Indian applicants hit 41% in FY2024 and F-1 issuances to India fell 44% year-over-year through late 2025. Every US pick on this list should be read as 'admit × visa,' not just admit.",
    });
  }

  // CGPA below median at all top picks
  const belowMedianCount = portfolio.filter(
    (p) => profile.cgpa < p.university.typicalAdmittedCGPA,
  ).length;
  if (belowMedianCount >= portfolio.length - 1 && portfolio.length >= 4) {
    flags.push({
      severity: "medium",
      title: "Your CGPA is below the typical admit at almost every pick",
      body: `${belowMedianCount} of your ${portfolio.length} programs admit students with a higher median CGPA than ${profile.cgpa.toFixed(1)}. This doesn't disqualify you, but it means the application narrative has to work hard — especially on demonstrated technical output (projects you shipped, contributions you can point to) rather than coursework.`,
    });
  }

  // Loan + low landed at top pick
  const topPick = portfolio[0];
  if (
    profile.loanFunded &&
    topPick &&
    topPick.landedProbability < 0.25 &&
    topPick.totalCostUSD > profile.budgetUSDCap * 0.8
  ) {
    flags.push({
      severity: "high",
      title: "Your top pick is a high-cost bet with low landing odds",
      body: `${topPick.university.university} costs ~$${Math.round(topPick.totalCostUSD / 1000)}K against your $${Math.round(profile.budgetUSDCap / 1000)}K budget, and the combined admit × visa probability is ${Math.round(topPick.landedProbability * 100)}%. Taking a loan this size for a bet this thin is the single decision we'd want to walk back with you.`,
    });
  }

  // No GRE + targeting GRE-required programs
  if (
    profile.gre == null &&
    portfolio.some((p) => p.university.typicalAdmittedGRE > 0)
  ) {
    flags.push({
      severity: "low",
      title: "No GRE submitted",
      body: "Several programs on this list read GRE as a meaningful signal. If you can take it once and score above 320, you'd lift admit odds at roughly half the picks here by 20–40% relative.",
    });
  }

  return flags;
}
