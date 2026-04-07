// Leap Review pipeline — extracted so it can be called from both the API
// route AND the eval runner without spinning up an HTTP server.
//
// The pipeline is 3 stages:
//   Stage 1 — Cliché scan        (deterministic regex)
//   Stage 2 — Rubric scoring     (LLM, tool use)
//   Stage 3 — Issue annotations  (LLM, tool use, grounded in stage 2)
//
// runReviewPipeline() returns { report, trace }. The trace captures the
// per-stage prompts, outputs, and timings — used by the trace UI panel and
// surfaced raw to the eval runner.

import Anthropic from "@anthropic-ai/sdk";
import { scanCliches, type DeterministicMatch } from "@/lib/cliches";
import { getRubric } from "@/lib/rubrics";
import {
  annotationSystemPrompt,
  annotationToolSchema,
  buildAnnotationUserMessage,
  buildScoringUserMessage,
  scoringSystemPrompt,
  scoringToolSchema,
} from "@/lib/review-prompts";
import type {
  ActionItem,
  DimensionScore,
  FlagAnnotation,
  FlagCategory,
  FlagSeverity,
  MissingItem,
  OverallBand,
  ProgramId,
  ReviewReport,
  StageTiming,
} from "@/lib/review-types";

// ── Trace types (surfaced through the API + UI + eval) ──────

export interface PipelineStageTrace {
  stage: "cliche-scan" | "scoring" | "annotation";
  label: string;
  ms: number;
  // Stage 1 has no LLM. Stage 2 + 3 do.
  llm?: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    tool: string;
    rawToolInput: unknown;
  };
  // Cheap, structured snapshot of what this stage produced. Used in the UI.
  output: unknown;
}

export interface PipelineTrace {
  programId: ProgramId;
  startedAt: string;
  totalMs: number;
  stages: PipelineStageTrace[];
}

export interface PipelineResult {
  report: ReviewReport;
  trace: PipelineTrace;
}

export interface PipelineProgressEvent {
  type: "stage-start" | "stage-end";
  stage: "cliche-scan" | "scoring" | "annotation";
  label: string;
  ms?: number;
}

export interface PipelineOptions {
  studentName?: string | null;
  // Inject an Anthropic client (eval runner can pass its own; tests can mock).
  client?: Anthropic;
  // Fires before and after each stage. Used by the streaming endpoint.
  onProgress?: (event: PipelineProgressEvent) => void;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY is not configured. The review pipeline runs real LLM calls — set the env var and restart the server.",
    );
    this.name = "MissingApiKeyError";
  }
}

// ── Main entry ──────────────────────────────────────────────

export async function runReviewPipeline(
  sopText: string,
  programId: ProgramId,
  options: PipelineOptions = {},
): Promise<PipelineResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const stages: PipelineStageTrace[] = [];
  const progress = options.onProgress;

  // Stage 1 — Cliché scan (deterministic, always runs).
  progress?.({
    type: "stage-start",
    stage: "cliche-scan",
    label: "Scanning for clichés",
  });
  const stage1Start = Date.now();
  const clicheMatches = scanCliches(sopText);
  const stage1Ms = Date.now() - stage1Start;
  progress?.({
    type: "stage-end",
    stage: "cliche-scan",
    label: "Scanning for clichés",
    ms: stage1Ms,
  });
  stages.push({
    stage: "cliche-scan",
    label: "Cliché scan (deterministic)",
    ms: stage1Ms,
    output: {
      matchCount: clicheMatches.length,
      matches: clicheMatches.map((m) => ({
        phrase: m.phrase,
        category: m.category,
        why: m.why,
      })),
    },
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const client = options.client ?? (apiKey ? new Anthropic({ apiKey }) : null);

  if (!client) {
    throw new MissingApiKeyError();
  }

  {
    // Stage 2 — Rubric scoring.
    progress?.({
      type: "stage-start",
      stage: "scoring",
      label: "Scoring against admitted baseline",
    });
    const stage2Start = Date.now();
    const stage2 = await runScoringStage(client, sopText, programId, clicheMatches);
    const stage2Ms = Date.now() - stage2Start;
    progress?.({
      type: "stage-end",
      stage: "scoring",
      label: "Scoring against admitted baseline",
      ms: stage2Ms,
    });
    stages.push({
      stage: "scoring",
      label: "Rubric scoring (LLM, tool-use)",
      ms: stage2Ms,
      llm: stage2.llm,
      output: {
        overallBand: stage2.result.overallBand,
        asIsPercentile: stage2.result.asIsPercentile,
        withFixesPercentile: stage2.result.withFixesPercentile,
        verdict: stage2.result.verdict,
        scores: stage2.result.scores,
        missingItems: stage2.result.missingItems,
      },
    });

    // Stage 3 — Annotations.
    progress?.({
      type: "stage-start",
      stage: "annotation",
      label: "Annotating issues in your draft",
    });
    const stage3Start = Date.now();
    const stage3 = await runAnnotationStage(
      client,
      sopText,
      stage2.result,
      clicheMatches,
    );
    const stage3Ms = Date.now() - stage3Start;
    progress?.({
      type: "stage-end",
      stage: "annotation",
      label: "Annotating issues in your draft",
      ms: stage3Ms,
    });
    stages.push({
      stage: "annotation",
      label: "Issue annotations (LLM, grounded in scores)",
      ms: stage3Ms,
      llm: stage3.llm,
      output: {
        llmFlagCount: stage3.flags.length,
        flags: stage3.flags.map((f) => ({
          phrase: f.phrase,
          category: f.category,
          severity: f.severity,
          why: f.why,
        })),
      },
    });

    const flags = mergeFlags(clicheMatches, stage3.flags);
    const rubric = getRubric(programId);

    const stageTimings: StageTiming[] = [
      { stage: "Cliché scan", ms: stage1Ms },
      { stage: "Rubric scoring", ms: stage2Ms },
      { stage: "Issue annotations", ms: stage3Ms },
    ];

    const report: ReviewReport = {
      programId,
      programName: rubric.programName,
      university: rubric.university,
      generatedAt: new Date().toISOString(),
      studentName: options.studentName ?? null,
      wordCount: sopText.trim().split(/\s+/).length,
      sopText,
      overallBand: stage2.result.overallBand,
      asIsPercentile: stage2.result.asIsPercentile,
      withFixesPercentile: stage2.result.withFixesPercentile,
      percentileStatement: stage2.result.percentileStatement,
      verdict: stage2.result.verdict,
      scores: stage2.result.scores,
      flags,
      missingItems: stage2.result.missingItems,
      actionPlan: stage2.result.actionPlan,
      stageTimings,
    };

    return {
      report,
      trace: {
        programId,
        startedAt,
        totalMs: Date.now() - t0,
        stages,
      },
    };
  }
}

// ── Stage 2: scoring ────────────────────────────────────────

interface ScoringResult {
  overallBand: OverallBand;
  asIsPercentile: number;
  withFixesPercentile: number;
  percentileStatement: string;
  verdict: string;
  scores: DimensionScore[];
  missingItems: MissingItem[];
  actionPlan: ActionItem[];
}

async function runScoringStage(
  client: Anthropic,
  sopText: string,
  programId: ProgramId,
  clicheMatches: DeterministicMatch[],
): Promise<{ result: ScoringResult; llm: PipelineStageTrace["llm"] }> {
  const rubric = getRubric(programId);
  const userMessage = buildScoringUserMessage(sopText, rubric, clicheMatches);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: scoringSystemPrompt,
    tools: [scoringToolSchema as never],
    tool_choice: { type: "tool", name: "emit_review" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Stage 2 (scoring): model did not call emit_review");
  }
  const raw = toolUse.input as {
    overallBand: OverallBand;
    asIsPercentile: number;
    withFixesPercentile: number;
    percentileStatement: string;
    verdict: string;
    scores: { key: string; score: number; rationale: string }[];
    missingItems: MissingItem[];
    actionPlan: ActionItem[];
  };

  const dimByKey = new Map(rubric.dimensions.map((d) => [d.key, d]));
  const scores: DimensionScore[] = raw.scores
    .map((s) => {
      const dim = dimByKey.get(s.key);
      if (!dim) return null;
      return {
        key: s.key,
        label: dim.label,
        score: clamp10(s.score),
        admittedMedian: dim.admittedMedian,
        rationale: s.rationale,
      };
    })
    .filter((x): x is DimensionScore => x !== null);

  const asIs = clampPercentile(raw.asIsPercentile);
  const withFixes = Math.max(asIs, clampPercentile(raw.withFixesPercentile));
  return {
    result: {
      overallBand: raw.overallBand,
      asIsPercentile: asIs,
      withFixesPercentile: withFixes,
      percentileStatement: raw.percentileStatement,
      verdict: raw.verdict,
      scores,
      missingItems: raw.missingItems.slice(0, 8),
      actionPlan: (raw.actionPlan ?? []).slice(0, 3),
    },
    llm: {
      model: "claude-sonnet-4-6",
      systemPrompt: scoringSystemPrompt,
      userMessage,
      tool: "emit_review",
      rawToolInput: raw,
    },
  };
}

// ── Stage 3: annotations ────────────────────────────────────

async function runAnnotationStage(
  client: Anthropic,
  sopText: string,
  scoring: ScoringResult,
  clicheMatches: DeterministicMatch[],
): Promise<{ flags: FlagAnnotation[]; llm: PipelineStageTrace["llm"] }> {
  const scoreSummary = scoring.scores
    .map(
      (s) =>
        `  - ${s.key}: ${s.score}/10 (admitted median ${s.admittedMedian}) — ${s.rationale}`,
    )
    .join("\n");
  const userMessage = buildAnnotationUserMessage(sopText, scoreSummary, clicheMatches);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1536,
    system: annotationSystemPrompt,
    tools: [annotationToolSchema as never],
    tool_choice: { type: "tool", name: "emit_annotations" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Stage 3 (annotations): model did not call emit_annotations");
  }
  const raw = toolUse.input as {
    annotations: {
      phrase: string;
      category: FlagCategory;
      severity: FlagSeverity;
      why: string;
    }[];
  };

  const flags: FlagAnnotation[] = [];
  for (const a of raw.annotations) {
    const span = locatePhrase(sopText, a.phrase);
    if (!span) continue;
    flags.push({
      start: span.start,
      end: span.end,
      phrase: sopText.slice(span.start, span.end),
      category: a.category,
      severity: a.severity,
      why: a.why,
    });
  }

  return {
    flags,
    llm: {
      model: "claude-sonnet-4-6",
      systemPrompt: annotationSystemPrompt,
      userMessage,
      tool: "emit_annotations",
      rawToolInput: raw,
    },
  };
}

// ── Phrase → span resolver ──────────────────────────────────

function locatePhrase(
  sopText: string,
  phrase: string,
): { start: number; end: number } | null {
  if (!phrase || phrase.length < 3) return null;
  let idx = sopText.indexOf(phrase);
  if (idx !== -1) return { start: idx, end: idx + phrase.length };

  idx = sopText.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx !== -1) return { start: idx, end: idx + phrase.length };

  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const normPhrase = norm(phrase).toLowerCase();
  const normSop = norm(sopText).toLowerCase();
  const normIdx = normSop.indexOf(normPhrase);
  if (normIdx === -1) return null;

  let origIdx = 0;
  let normCursor = 0;
  while (origIdx < sopText.length && normCursor < normIdx) {
    const ch = sopText[origIdx];
    if (/\s/.test(ch)) {
      while (origIdx < sopText.length && /\s/.test(sopText[origIdx])) origIdx++;
      normCursor++;
    } else {
      origIdx++;
      normCursor++;
    }
  }
  const start = origIdx;
  let end = start;
  let consumed = 0;
  while (end < sopText.length && consumed < normPhrase.length) {
    const ch = sopText[end];
    if (/\s/.test(ch)) {
      while (end < sopText.length && /\s/.test(sopText[end])) end++;
      consumed++;
    } else {
      end++;
      consumed++;
    }
  }
  if (end <= start) return null;
  return { start, end };
}

// ── helpers ────────────────────────────────────────────────

function clamp10(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}

function clampPercentile(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(99, Math.round(n)));
}

function mergeFlags(
  clicheMatches: DeterministicMatch[],
  llmFlags: FlagAnnotation[],
): FlagAnnotation[] {
  const fromCliches: FlagAnnotation[] = clicheMatches.map((m) => ({
    start: m.start,
    end: m.end,
    phrase: m.phrase,
    category: "cliche",
    severity: m.category === "childhood-opening" ? "high" : "medium",
    why: m.why,
  }));
  const all = [...fromCliches, ...llmFlags];
  all.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: FlagAnnotation[] = [];
  for (const f of all) {
    const prev = out[out.length - 1];
    if (prev && f.start < prev.end) continue;
    out.push(f);
  }
  return out;
}
