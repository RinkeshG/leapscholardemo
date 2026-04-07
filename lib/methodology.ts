// Copy used by MethodologyDrawer. Plain content; no JSX so it can live in lib/.

export interface MethodologyItem {
  id: string;
  title: string;
  body: string;
}

export const briefMethodology: MethodologyItem[] = [
  {
    id: "data",
    title: "Where the numbers come from",
    body: "Baseline admit rates and visa approval rates are pulled from a hand-curated dataset of 30 programs across the US, UK, Canada, Germany, Ireland, and Australia — the destinations Indian students actually apply to. Visa numbers reflect the most recent published refusal data: F-1 refusals at ~41% (FY24), Canadian study permit refusals at ~71% (Q4 2025), and the UK Graduate visa stay-back at 24 months. These are not estimates, they are the published reality.",
  },
  {
    id: "scoring",
    title: "How your profile moves the baseline",
    body: "We start at the published admit rate for each program. Then we apply explicit, auditable adjustments based on your CGPA gap vs the typical admit, your college tier (only for elite US programs, where it actually matters), your GRE delta vs the program's median, and your work experience bucket. Each adjustment is shown to you on the per-program drilldown — there are no hidden multipliers and no LLM-fabricated odds. The math is in lib/scoring.ts.",
  },
  {
    id: "fitband",
    title: "How a program lands in Target / Reach / Safety / Skip",
    body: "Fit bands are derived from combined admit × visa probability, not admit alone. A program with 60% admit but 25% visa lands as Skip — because that's a 15% chance of you actually getting there. Anything where the visa probability is below 35% is automatically marked Skip regardless of admit math. This is why you'll see Canadian and some US picks downgraded for the 2026 cycle.",
  },
  {
    id: "edge",
    title: "Why an edge move ever shows up outside your preferred countries",
    body: "If a program outside your selected countries has meaningfully better landed-probability × ROI than your weakest preferred pick, we surface it as an Alternate Bet. We don't suppress information because you didn't ask. Most counselors won't tell you about TU Munich or Trinity College Dublin because they don't earn a partner commission on them; the model has no commission to defend.",
  },
  {
    id: "cohort",
    title: "Who the comparable students are",
    body: "The three students you see on each drilldown are anonymized from a Leap-style outcome cohort with profiles within ~0.4 CGPA, the same college tier bucket, and the same work-experience bucket as you. The 'what happened next' narratives reflect the modal outcome for that cohort over the last three admission cycles — not best-case storytelling.",
  },
  {
    id: "llm",
    title: "What the LLM actually does",
    body: "The language model writes the verdict, the per-program rationales, the edge-move headlines, and the action plan. It does not invent a single number. Admit rates, visa rates, costs, ROI, and fit bands are computed deterministically before the model is called, then handed to it as fixed inputs. If the model and the math ever disagreed, the math wins.",
  },
  {
    id: "honest",
    title: "What we're choosing not to do",
    body: "We don't hide programs where the answer is 'skip this.' We don't pad the list to 8 if 6 is the honest number. We don't soften visa reality. We don't suppress alternate bets because a counselor doesn't earn on them. And we don't store your inputs — the brief lives only in your browser session.",
  },
];
