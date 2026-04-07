// Eval runner for Leap Review.
//
// Loads the labeled SOPs in eval/sops.ts, runs each through the pipeline,
// compares the output to the ground truth, and writes a Markdown report to
// eval/report.md.
//
// Usage:
//   npm run eval                # all SOPs
//   npm run eval -- --id=cmu-strong-1
//   npm run eval -- --program=cmu-mscs
//
// The runner is intentionally a thin loop on top of runReviewPipeline().
// It does NOT go through the HTTP route — that would force us to spin up the
// dev server, double the latency, and lose the trace fidelity.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env.local manually so the runner doesn't depend on Node's --env-file flag.
function loadDotenv(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(here, "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}
loadDotenv();
import { runReviewPipeline } from "@/lib/review-pipeline";
import type { PipelineResult } from "@/lib/review-pipeline";
import type {
  DimensionScore,
  OverallBand,
  ReviewReport,
} from "@/lib/review-types";
import { evalSops, type EvalSop } from "./sops";

interface DimensionCheck {
  key: string;
  expected: number;
  actual: number;
  delta: number;
  withinTolerance: boolean;
}

interface CountCheck {
  expectedMin: number;
  expectedMax: number;
  actual: number;
  withinRange: boolean;
}

interface SopEvalResult {
  sop: EvalSop;
  pipeline: PipelineResult;
  bandMatch: boolean;
  dimensionChecks: DimensionCheck[];
  dimensionsPassed: number;
  dimensionsTotal: number;
  clicheCheck: CountCheck;
  flagCheck: CountCheck;
  overallPassed: boolean;
  errorMessage: string | null;
}

interface AggregateStats {
  total: number;
  bandHits: number;
  dimensionHits: number;
  dimensionTotal: number;
  clicheHits: number;
  flagHits: number;
  fullPass: number;
  errors: number;
  totalLatencyMs: number;
}

// ── CLI args ────────────────────────────────────────────────

function parseArgs(): { id?: string; program?: string } {
  const out: { id?: string; program?: string } = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--id=")) out.id = arg.slice(5);
    else if (arg.startsWith("--program=")) out.program = arg.slice(10);
  }
  return out;
}

// ── Comparison ──────────────────────────────────────────────

function checkSop(
  sop: EvalSop,
  result: PipelineResult,
): SopEvalResult {
  const report = result.report;
  const dimByKey = new Map<string, DimensionScore>(
    report.scores.map((s) => [s.key, s]),
  );

  const dimensionChecks: DimensionCheck[] = (
    Object.keys(sop.expectedScores) as (keyof typeof sop.expectedScores)[]
  ).map((key) => {
    const expected = sop.expectedScores[key];
    const actual = dimByKey.get(key)?.score ?? -1;
    const delta = Math.abs(actual - expected);
    return {
      key,
      expected,
      actual,
      delta,
      withinTolerance: actual >= 0 && delta <= sop.scoreTolerance,
    };
  });
  const dimensionsPassed = dimensionChecks.filter((d) => d.withinTolerance).length;

  const cliches = (result.trace.stages[0].output as { matchCount: number })
    .matchCount;
  const clicheCheck: CountCheck = {
    expectedMin: sop.expectedClicheCount.min,
    expectedMax: sop.expectedClicheCount.max,
    actual: cliches,
    withinRange:
      cliches >= sop.expectedClicheCount.min &&
      cliches <= sop.expectedClicheCount.max,
  };

  const flagCount = report.flags.length;
  const flagCheck: CountCheck = {
    expectedMin: sop.expectedFlagCount.min,
    expectedMax: sop.expectedFlagCount.max,
    actual: flagCount,
    withinRange:
      flagCount >= sop.expectedFlagCount.min &&
      flagCount <= sop.expectedFlagCount.max,
  };

  const bandMatch = report.overallBand === sop.qualityBand;
  const overallPassed =
    bandMatch &&
    clicheCheck.withinRange &&
    flagCheck.withinRange &&
    dimensionsPassed >= dimensionChecks.length - 1; // tolerate 1 miss

  return {
    sop,
    pipeline: result,
    bandMatch,
    dimensionChecks,
    dimensionsPassed,
    dimensionsTotal: dimensionChecks.length,
    clicheCheck,
    flagCheck,
    overallPassed,
    errorMessage: null,
  };
}

function makeErrorResult(sop: EvalSop, err: unknown): SopEvalResult {
  return {
    sop,
    pipeline: null as unknown as PipelineResult,
    bandMatch: false,
    dimensionChecks: [],
    dimensionsPassed: 0,
    dimensionsTotal: Object.keys(sop.expectedScores).length,
    clicheCheck: { expectedMin: 0, expectedMax: 0, actual: -1, withinRange: false },
    flagCheck: { expectedMin: 0, expectedMax: 0, actual: -1, withinRange: false },
    overallPassed: false,
    errorMessage: err instanceof Error ? err.message : String(err),
  };
}

// ── Markdown report ─────────────────────────────────────────

function bandEmoji(b: OverallBand): string {
  return b === "strong" ? "S" : b === "average" ? "A" : "W";
}

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function renderMarkdown(
  results: SopEvalResult[],
  agg: AggregateStats,
  startedAt: Date,
): string {
  const lines: string[] = [];
  lines.push("# Leap Review — Eval Report");
  lines.push("");
  lines.push(
    `_Generated ${startedAt.toISOString()} · ${agg.total} SOPs · ${(
      agg.totalLatencyMs / 1000
    ).toFixed(1)}s total pipeline time_`,
  );
  lines.push("");
  lines.push("## What this is");
  lines.push("");
  lines.push(
    "This report runs the full review pipeline against a labeled set of synthesized SOPs and reports how well the pipeline matches the ground-truth labels. The eval set lives in `eval/sops.ts`. **The SOPs are synthetic** (see the provenance comment at the top of `eval/sops.ts`); the value of this report is regression coverage, not real-world validation.",
  );
  lines.push("");

  // Headline numbers.
  lines.push("## Headline");
  lines.push("");
  lines.push("| Metric | Result |");
  lines.push("|---|---|");
  lines.push(
    `| Overall band match (weak/average/strong) | **${agg.bandHits}/${agg.total}** (${pct(agg.bandHits, agg.total)}) |`,
  );
  lines.push(
    `| Per-dimension scores within ±tolerance | **${agg.dimensionHits}/${agg.dimensionTotal}** (${pct(agg.dimensionHits, agg.dimensionTotal)}) |`,
  );
  lines.push(
    `| Cliché count in expected range | **${agg.clicheHits}/${agg.total}** (${pct(agg.clicheHits, agg.total)}) |`,
  );
  lines.push(
    `| Flag count in expected range | **${agg.flagHits}/${agg.total}** (${pct(agg.flagHits, agg.total)}) |`,
  );
  lines.push(
    `| Full pass (band + counts + ≥5/6 dims) | **${agg.fullPass}/${agg.total}** (${pct(agg.fullPass, agg.total)}) |`,
  );
  if (agg.errors > 0) {
    lines.push(`| Pipeline errors | **${agg.errors}/${agg.total}** |`);
  }
  lines.push("");

  // Summary table.
  lines.push("## Per-SOP results");
  lines.push("");
  lines.push("| ID | Program | Expected | Actual | Dims | Clichés | Flags | Pass |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const expected = bandEmoji(r.sop.qualityBand);
    const actual = r.pipeline?.report
      ? bandEmoji(r.pipeline.report.overallBand)
      : "?";
    const bandCell = r.bandMatch ? `${actual} ✓` : `${actual} ✗`;
    const dims = `${r.dimensionsPassed}/${r.dimensionsTotal}`;
    const clich = r.clicheCheck.withinRange
      ? `${r.clicheCheck.actual} ✓`
      : `${r.clicheCheck.actual} ✗ (${r.clicheCheck.expectedMin}-${r.clicheCheck.expectedMax})`;
    const flags = r.flagCheck.withinRange
      ? `${r.flagCheck.actual} ✓`
      : `${r.flagCheck.actual} ✗ (${r.flagCheck.expectedMin}-${r.flagCheck.expectedMax})`;
    const pass = r.overallPassed ? "**PASS**" : "FAIL";
    lines.push(
      `| \`${r.sop.id}\` | ${r.sop.programId} | ${expected} | ${bandCell} | ${dims} | ${clich} | ${flags} | ${pass} |`,
    );
  }
  lines.push("");

  // Detail per SOP.
  lines.push("## Details");
  lines.push("");
  for (const r of results) {
    lines.push(`### \`${r.sop.id}\` — ${r.sop.programId}`);
    lines.push("");
    lines.push(`**Intent:** ${r.sop.intent}`);
    lines.push("");
    if (r.errorMessage) {
      lines.push(`**ERROR:** ${r.errorMessage}`);
      lines.push("");
      continue;
    }
    const report: ReviewReport = r.pipeline.report;
    lines.push(
      `**Verdict:** ${report.verdict} _(${report.overallBand}, ${r.bandMatch ? "matches expected" : `expected ${r.sop.qualityBand}`})_`,
    );
    lines.push("");
    lines.push("**Dimension scores:**");
    lines.push("");
    lines.push("```");
    lines.push(
      pad("dimension", 24) +
        pad("expected", 12) +
        pad("actual", 10) +
        pad("Δ", 6) +
        "ok",
    );
    for (const d of r.dimensionChecks) {
      lines.push(
        pad(d.key, 24) +
          pad(String(d.expected), 12) +
          pad(String(d.actual), 10) +
          pad(d.delta.toFixed(0), 6) +
          (d.withinTolerance ? "✓" : "✗"),
      );
    }
    lines.push("```");
    lines.push("");

    if (r.sop.criticalIssuesShouldCatch.length > 0) {
      lines.push("**Should have caught:**");
      for (const c of r.sop.criticalIssuesShouldCatch) {
        lines.push(`- ${c}`);
      }
      lines.push("");
      lines.push("**Did flag:**");
      if (report.flags.length === 0) {
        lines.push("- _(none)_");
      } else {
        for (const f of report.flags.slice(0, 8)) {
          lines.push(
            `- [${f.severity}/${f.category}] "${f.phrase.replace(/\n/g, " ").slice(0, 80)}" — ${f.why}`,
          );
        }
        if (report.flags.length > 8) {
          lines.push(`- _(…${report.flags.length - 8} more)_`);
        }
      }
      lines.push("");
    }

    if (r.sop.shouldNotFlag.length > 0) {
      lines.push("**Should NOT flag (false-positive guard):**");
      for (const c of r.sop.shouldNotFlag) {
        lines.push(`- ${c}`);
      }
      lines.push("");
    }

    const tot = r.pipeline.trace.totalMs;
    const stageTimings = r.pipeline.trace.stages
      .map((s) => `${s.label.split(" ")[0]}: ${s.ms}ms`)
      .join(" · ");
    lines.push(`**Pipeline:** ${tot}ms total · ${stageTimings}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("## How to read this report");
  lines.push("");
  lines.push(
    "- **Band match** is the strongest single signal — if the pipeline calls a strong SOP weak (or vice versa), the verdict is unusable.",
  );
  lines.push(
    "- **Per-dimension scores within ±tolerance** measures whether the pipeline differentiates between dimensions correctly. A SOP that scores all 6/10 across the board is suspicious even if the average is right.",
  );
  lines.push(
    "- **Cliché counts** test the deterministic Stage 1 — these should be near-perfect because the scanner is regex.",
  );
  lines.push(
    "- **Flag counts** test Stage 3 — false positives (flagging strong SOPs) and false negatives (missing weak SOPs) cost the counselor differently. Watch the strong-band rows for false positives and the weak-band rows for false negatives.",
  );
  lines.push("");

  return lines.join("\n");
}

// ── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY not set. The eval needs a real key — fixture mode would defeat the purpose.",
    );
    console.error("Add ANTHROPIC_API_KEY=sk-ant-... to .env.local at the project root.");
    process.exit(1);
  }

  const args = parseArgs();
  let set = evalSops;
  if (args.id) set = set.filter((s) => s.id === args.id);
  if (args.program) set = set.filter((s) => s.programId === args.program);
  if (set.length === 0) {
    console.error("No SOPs matched filters.");
    process.exit(1);
  }

  console.log(`Running eval against ${set.length} SOPs...\n`);
  const startedAt = new Date();
  const results: SopEvalResult[] = [];

  for (const sop of set) {
    process.stdout.write(`  ${pad(sop.id, 22)} `);
    try {
      const result = await runReviewPipeline(sop.text, sop.programId);
      const checked = checkSop(sop, result);
      results.push(checked);
      const tot = result.trace.totalMs;
      console.log(
        `${checked.overallPassed ? "PASS" : "FAIL"}  band=${checked.bandMatch ? "✓" : "✗"} dims=${checked.dimensionsPassed}/${checked.dimensionsTotal} flags=${checked.flagCheck.actual} ${tot}ms`,
      );
    } catch (err) {
      results.push(makeErrorResult(sop, err));
      console.log(`ERROR  ${err instanceof Error ? err.message : err}`);
    }
  }

  // Aggregate.
  const agg: AggregateStats = {
    total: results.length,
    bandHits: results.filter((r) => r.bandMatch).length,
    dimensionHits: results.reduce((s, r) => s + r.dimensionsPassed, 0),
    dimensionTotal: results.reduce((s, r) => s + r.dimensionsTotal, 0),
    clicheHits: results.filter((r) => r.clicheCheck.withinRange).length,
    flagHits: results.filter((r) => r.flagCheck.withinRange).length,
    fullPass: results.filter((r) => r.overallPassed).length,
    errors: results.filter((r) => r.errorMessage !== null).length,
    totalLatencyMs: results.reduce(
      (s, r) => s + (r.pipeline?.trace.totalMs ?? 0),
      0,
    ),
  };

  const md = renderMarkdown(results, agg, startedAt);
  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(here, "report.md");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, md);

  console.log("");
  console.log(
    `Summary: band ${agg.bandHits}/${agg.total} · dims ${agg.dimensionHits}/${agg.dimensionTotal} · cliché ${agg.clicheHits}/${agg.total} · flags ${agg.flagHits}/${agg.total} · full ${agg.fullPass}/${agg.total}`,
  );
  console.log(`Report → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
