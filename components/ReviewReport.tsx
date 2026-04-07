"use client";

import { useState } from "react";
import type {
  FlagAnnotation,
  FlagCategory,
  ReviewReport as ReviewReportType,
  ReviewResponse,
} from "@/lib/review-types";

interface Props {
  data: ReviewResponse;
  previousReport?: ReviewReportType | null;
  onOpenMethodology: () => void;
}

export function ReviewReport({ data, previousReport, onOpenMethodology }: Props) {
  const { report } = data;
  const [activeFlagIdx, setActiveFlagIdx] = useState<number | null>(null);
  const isRevision = !!previousReport && previousReport.programId === report.programId;
  const prev = isRevision ? previousReport : null;

  return (
    <article className="bg-white border border-rule rounded-xl shadow-card overflow-hidden animate-fadeIn">
      <Header
        report={report}
        previousReport={prev}
        onOpenMethodology={onOpenMethodology}
        onPrint={() => window.print()}
      />
      <Verdict report={report} previousReport={prev} />
      <ScoresPanel report={report} previousReport={prev} />
      <AnnotatedSop
        report={report}
        activeFlagIdx={activeFlagIdx}
        onSelect={setActiveFlagIdx}
      />
      <MissingPanel report={report} />
      <ActionPlan report={report} />
      <CounselorCTA />
      <Footer report={report} onOpenMethodology={onOpenMethodology} />
    </article>
  );
}

// ── Header ─────────────────────────────────────────────────

function Header({
  report,
  previousReport,
  onOpenMethodology,
  onPrint,
}: {
  report: ReviewReportType;
  previousReport: ReviewReportType | null;
  onOpenMethodology: () => void;
  onPrint: () => void;
}) {
  const date = new Date(report.generatedAt);
  const dateStr = date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <header className="border-b border-rule px-6 py-5 flex items-start justify-between gap-6">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.12em] text-purple font-semibold mb-1.5 flex items-center gap-2">
          <span>Leap Review</span>
          {previousReport && (
            <span className="inline-flex items-center gap-1 px-2 py-[1px] rounded-full bg-purple text-white text-[9px] tracking-[0.06em]">
              Revised draft · v2
            </span>
          )}
        </div>
        <h1 className="font-display text-[26px] font-bold tracking-tighter2 text-navy leading-tight">
          {report.studentName ? `${report.studentName}'s SOP` : "Your SOP"}
          <span className="text-ink-faint font-normal text-[16px] ml-2">
            for {report.programName}
          </span>
        </h1>
        <div className="text-[13px] text-ink-muted mt-1 leading-snug">
          {report.university} ·{" "}
          <span className="num">{report.wordCount}</span> words
        </div>
      </div>
      <div className="text-right shrink-0 no-print">
        <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          Reviewed
        </div>
        <div className="text-[12px] text-ink num">{dateStr}</div>
        <div className="flex gap-1.5 mt-2 justify-end">
          <button
            onClick={onOpenMethodology}
            className="text-[10px] uppercase tracking-[0.06em] font-semibold border border-rule rounded-md px-2.5 py-1 text-ink-muted hover:border-purple hover:text-purple transition-colors"
          >
            How this works
          </button>
          <button
            onClick={onPrint}
            className="text-[10px] uppercase tracking-[0.06em] font-semibold border border-rule rounded-md px-2.5 py-1 text-ink-muted hover:border-purple hover:text-purple transition-colors"
          >
            Save as PDF
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Verdict ────────────────────────────────────────────────

function Verdict({
  report,
  previousReport,
}: {
  report: ReviewReportType;
  previousReport: ReviewReportType | null;
}) {
  const bandColor =
    report.overallBand === "strong"
      ? "bg-success"
      : report.overallBand === "average"
        ? "bg-warn"
        : "bg-danger";
  const bandLabel =
    report.overallBand === "strong"
      ? "Strong draft"
      : report.overallBand === "average"
        ? "Workable draft"
        : "Below baseline";
  return (
    <section className="border-b border-rule px-6 py-5 bg-purple-tint/40">
      <div className="flex gap-4">
        <div className="w-1 bg-purple rounded-full shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="text-[10px] uppercase tracking-[0.12em] text-purple font-semibold">
              The honest take on your draft
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.06em] text-ink-muted font-semibold border border-rule rounded-full px-2 py-[1px] bg-white">
              <span className={`w-1.5 h-1.5 rounded-full ${bandColor}`} />
              {bandLabel}
            </span>
          </div>
          <p className="font-display text-[19px] text-navy leading-snug font-semibold tracking-tightish">
            {report.verdict}
          </p>
          <PercentileBar report={report} previousReport={previousReport} />
        </div>
      </div>
    </section>
  );
}

function PercentileBar({
  report,
  previousReport,
}: {
  report: ReviewReportType;
  previousReport: ReviewReportType | null;
}) {
  const asIs = report.asIsPercentile;
  const withFixes = report.withFixesPercentile;
  const delta = withFixes - asIs;
  const revisionDelta = previousReport
    ? asIs - previousReport.asIsPercentile
    : null;
  return (
    <div className="mt-4 bg-white border border-rule rounded-xl px-4 py-3">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-ink-muted">
          Where you sit vs. admitted Indian applicants at {report.university}
        </div>
        <div className="flex items-center gap-2">
          {revisionDelta !== null && revisionDelta !== 0 && (
            <div
              className={`text-[10px] uppercase tracking-[0.06em] font-semibold num inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full ${
                revisionDelta > 0
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              }`}
            >
              {revisionDelta > 0 ? "↑" : "↓"} {Math.abs(revisionDelta)} vs v1
            </div>
          )}
          {delta > 0 && (
            <div className="text-[10px] uppercase tracking-[0.06em] font-semibold text-purple num">
              +{delta} pts after fixes
            </div>
          )}
        </div>
      </div>
      <div className="relative h-2.5 bg-surface rounded-full">
        {/* with-fixes bar (lighter) */}
        <div
          className="absolute inset-y-0 left-0 bg-purple-pale rounded-full"
          style={{ width: `${withFixes}%` }}
        />
        {/* as-is bar (solid) */}
        <div
          className="absolute inset-y-0 left-0 bg-purple rounded-full"
          style={{ width: `${asIs}%` }}
        />
        {/* median tick */}
        <div
          className="absolute top-[-3px] bottom-[-3px] w-px bg-navy"
          style={{ left: "50%" }}
          aria-label="Median admit"
        />
      </div>
      <div className="flex items-baseline justify-between mt-1.5 text-[10px] text-ink-faint num">
        <span>Bottom</span>
        <span className="font-semibold text-navy normal-case tracking-normal">
          Median admit
        </span>
        <span>Top</span>
      </div>
      <div className="text-[12px] text-ink-muted leading-relaxed mt-2">
        {report.percentileStatement}
      </div>
    </div>
  );
}

// ── Scores ─────────────────────────────────────────────────

function ScoresPanel({
  report,
  previousReport,
}: {
  report: ReviewReportType;
  previousReport: ReviewReportType | null;
}) {
  const prevByKey = new Map(
    (previousReport?.scores ?? []).map((s) => [s.key, s.score]),
  );
  return (
    <section className="border-b border-rule px-6 py-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-semibold">
            Score against admitted baseline
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            How this draft compares to admitted students at{" "}
            <span className="font-semibold text-navy">{report.university}</span>
            . Click any row to ask &ldquo;how do I move this up?&rdquo;
          </div>
        </div>
        <div className="text-[10px] text-ink-faint shrink-0">
          0–10 scale
        </div>
      </div>
      <div className="space-y-2">
        {report.scores.map((s) => (
          <ScoreRow
            key={s.key}
            score={s}
            report={report}
            previousScore={prevByKey.get(s.key) ?? null}
          />
        ))}
      </div>
    </section>
  );
}

function ScoreRow({
  score,
  report,
  previousScore,
}: {
  score: ReviewReportType["scores"][number];
  report: ReviewReportType;
  previousScore: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const delta = score.score - score.admittedMedian;
  const barColor =
    delta >= 0 ? "bg-success" : delta >= -2 ? "bg-warn" : "bg-danger";
  const pct = (score.score / 10) * 100;
  const medianPct = (score.admittedMedian / 10) * 100;

  async function fetchDrilldown() {
    if (answer || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/score-drilldown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sopText: report.sopText,
          programId: report.programId,
          dimensionKey: score.key,
          currentScore: score.score,
          admittedMedian: score.admittedMedian,
          rationale: score.rationale,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setAnswer(json.answer || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) fetchDrilldown();
  }

  return (
    <div className="text-[12px]">
      <div className="flex items-center gap-3">
        <div className="w-36 text-ink font-semibold shrink-0">{score.label}</div>
        <div className="flex-1 relative h-2 bg-surface rounded-full overflow-visible">
          <div
            className={`absolute inset-y-0 left-0 ${barColor} rounded-full transition-all`}
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-[-3px] bottom-[-3px] w-px bg-navy"
            style={{ left: `${medianPct}%` }}
            aria-label={`Admitted median ${score.admittedMedian}`}
          />
        </div>
        <div className="w-20 text-right shrink-0 num">
          <span
            className={`font-bold ${
              delta >= 0
                ? "text-success"
                : delta >= -2
                  ? "text-ink"
                  : "text-danger"
            }`}
          >
            {score.score}
          </span>
          <span className="text-ink-faint">/{score.admittedMedian}</span>
          {previousScore !== null && previousScore !== score.score && (
            <div
              className={`text-[9px] uppercase tracking-[0.06em] font-semibold mt-0.5 ${
                score.score > previousScore ? "text-success" : "text-danger"
              }`}
            >
              {score.score > previousScore ? "↑" : "↓"}{" "}
              {Math.abs(score.score - previousScore)} vs v1
            </div>
          )}
        </div>
      </div>
      <div className="ml-[156px] text-[11px] text-ink-muted leading-snug mt-0.5 flex items-baseline justify-between gap-3">
        <span className="flex-1">{score.rationale}</span>
        <button
          type="button"
          onClick={handleToggle}
          className="shrink-0 text-[10px] uppercase tracking-[0.06em] font-semibold text-purple hover:text-navy transition-colors no-print"
        >
          {open ? "Hide" : "How do I move this up? →"}
        </button>
      </div>
      {open && (
        <div className="ml-[156px] mt-2 border-l-2 border-purple bg-purple-tint/30 px-3 py-2.5 rounded-r-md text-[12px] text-navy leading-relaxed">
          {loading && (
            <div className="text-ink-muted italic">Reading your draft…</div>
          )}
          {error && <div className="text-danger">{error}</div>}
          {answer && <div className="whitespace-pre-wrap">{answer}</div>}
        </div>
      )}
    </div>
  );
}

// ── Annotated SOP ──────────────────────────────────────────

function AnnotatedSop({
  report,
  activeFlagIdx,
  onSelect,
}: {
  report: ReviewReportType;
  activeFlagIdx: number | null;
  onSelect: (i: number | null) => void;
}) {
  const segments = buildSegments(report.sopText, report.flags);
  const activeFlag =
    activeFlagIdx !== null ? report.flags[activeFlagIdx] ?? null : null;

  const sevCount = countBySeverity(report.flags);

  return (
    <section className="border-b border-rule px-6 py-5">
      <div className="flex items-baseline justify-between mb-3 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-semibold">
            Inline issues
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            {report.flags.length === 0
              ? "No issues flagged in the draft."
              : "Click any highlighted phrase to see why it was flagged."}
          </div>
        </div>
        {report.flags.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.06em] text-ink-faint font-semibold">
            <SevPill count={sevCount.high} label="High" color="bg-danger" />
            <SevPill count={sevCount.medium} label="Med" color="bg-warn" />
            <SevPill count={sevCount.low} label="Low" color="bg-ink-faint" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="border border-rule rounded-xl px-5 py-4 bg-surface text-[13px] leading-[1.7] text-ink whitespace-pre-wrap font-sans">
          {segments.map((seg, i) => {
            if (seg.type === "text") return <span key={i}>{seg.text}</span>;
            const isActive = activeFlagIdx === seg.flagIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  onSelect(isActive ? null : seg.flagIdx)
                }
                className={`underline decoration-2 underline-offset-2 cursor-pointer transition-colors px-0.5 rounded-sm ${flagClasses(seg.severity, isActive)}`}
              >
                {seg.text}
              </button>
            );
          })}
        </div>

        <aside className="border border-rule rounded-xl bg-white p-4 text-[12px] sticky top-20 self-start">
          {activeFlag ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-2 h-2 rounded-full ${sevDotClass(activeFlag.severity)}`}
                />
                <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-ink-muted">
                  {prettyCategory(activeFlag.category)}
                </span>
              </div>
              <div className="font-semibold text-navy text-[13px] leading-snug mb-2 italic">
                &ldquo;{truncate(activeFlag.phrase, 80)}&rdquo;
              </div>
              <div className="text-ink-muted leading-relaxed">
                {activeFlag.why}
              </div>
            </div>
          ) : (
            <div className="text-ink-muted leading-relaxed">
              <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-ink-faint mb-2">
                Tap a highlight
              </div>
              {report.flags.length === 0
                ? "No flags. Either this draft is genuinely clean, or the rubric for this program is permissive."
                : "Each highlight is a phrase the pipeline flagged. Click one to see what category it triggered and why it matters at this program."}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

interface Segment {
  type: "text" | "flag";
  text: string;
  flagIdx: number;
  severity: FlagAnnotation["severity"];
}

function buildSegments(
  sopText: string,
  flags: FlagAnnotation[],
): Segment[] {
  if (flags.length === 0)
    return [{ type: "text", text: sopText, flagIdx: -1, severity: "low" }];

  const sorted = flags
    .map((f, i) => ({ ...f, idx: i }))
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const f of sorted) {
    if (f.start < cursor) continue; // skip overlap
    if (f.start > cursor) {
      segments.push({
        type: "text",
        text: sopText.slice(cursor, f.start),
        flagIdx: -1,
        severity: "low",
      });
    }
    segments.push({
      type: "flag",
      text: sopText.slice(f.start, f.end),
      flagIdx: f.idx,
      severity: f.severity,
    });
    cursor = f.end;
  }
  if (cursor < sopText.length) {
    segments.push({
      type: "text",
      text: sopText.slice(cursor),
      flagIdx: -1,
      severity: "low",
    });
  }
  return segments;
}

function flagClasses(
  severity: FlagAnnotation["severity"],
  active: boolean,
): string {
  const base =
    severity === "high"
      ? "decoration-danger text-danger hover:bg-danger/10"
      : severity === "medium"
        ? "decoration-warn text-navy hover:bg-warn/10"
        : "decoration-ink-faint text-ink hover:bg-surface";
  const activeBg =
    severity === "high"
      ? "bg-danger/15"
      : severity === "medium"
        ? "bg-warn/20"
        : "bg-rule";
  return `${base} ${active ? activeBg : ""}`;
}

function sevDotClass(s: FlagAnnotation["severity"]): string {
  return s === "high" ? "bg-danger" : s === "medium" ? "bg-warn" : "bg-ink-faint";
}

function countBySeverity(flags: FlagAnnotation[]) {
  return flags.reduce(
    (acc, f) => {
      acc[f.severity]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );
}

function SevPill({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: string;
}) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="num text-ink">{count}</span> {label}
    </span>
  );
}

function prettyCategory(c: FlagCategory): string {
  switch (c) {
    case "cliche":
      return "Cliché";
    case "vague-claim":
      return "Vague claim";
    case "missing-program-hook":
      return "Missing program hook";
    case "tone-mismatch":
      return "Tone mismatch";
    case "weak-opening":
      return "Weak opening";
    case "generic-flattery":
      return "Generic flattery";
  }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

// ── Missing items ──────────────────────────────────────────

function MissingPanel({ report }: { report: ReviewReportType }) {
  const presentCount = report.missingItems.filter((i) => i.present).length;
  return (
    <section className="border-b border-rule px-6 py-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-semibold">
            Expected elements at {report.programName}
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            <span className="num text-navy font-semibold">
              {presentCount}/{report.missingItems.length}
            </span>{" "}
            present in this draft
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
        {report.missingItems.map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-[12px]">
            <div className="pt-[3px] shrink-0">
              {m.present ? (
                <span className="text-success font-bold">✓</span>
              ) : (
                <span className="text-danger font-bold">×</span>
              )}
            </div>
            <div
              className={
                m.present ? "text-ink" : "text-ink-muted line-through"
              }
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Action plan ────────────────────────────────────────────

function ActionPlan({ report }: { report: ReviewReportType }) {
  if (!report.actionPlan || report.actionPlan.length === 0) return null;
  return (
    <section className="border-b border-rule px-6 py-5 bg-purple-tint/30">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-purple font-semibold">
            What to fix tonight
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            Three changes, in priority order. Start with #1.
          </div>
        </div>
      </div>
      <ol className="space-y-3">
        {report.actionPlan.map((item, i) => (
          <li
            key={i}
            className="flex gap-3 bg-white border border-rule rounded-xl px-4 py-3 shadow-card"
          >
            <div className="shrink-0 w-6 h-6 rounded-full bg-purple text-white font-display font-bold text-[12px] flex items-center justify-center num">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-navy font-semibold leading-snug">
                {item.action}
              </div>
              <div className="text-[12px] text-ink-muted mt-1 leading-relaxed">
                {item.why}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── Leap counselor CTA ─────────────────────────────────────

function CounselorCTA() {
  return (
    <section className="border-b border-rule px-6 py-6 bg-navy text-white no-print">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.12em] text-purple-pale font-semibold mb-1">
            Once you&apos;ve revised
          </div>
          <div className="font-display text-[18px] font-bold tracking-tighter2 leading-tight">
            Want a Leap counselor to read your next draft?
          </div>
          <div className="text-[12px] text-white/70 mt-1 leading-relaxed max-w-[520px]">
            A real human who has reviewed thousands of SOPs at this exact program. Free 30-minute call, no pitch.
          </div>
        </div>
        <a
          href="https://leapscholar.com/counsellors"
          target="_blank"
          rel="noreferrer noopener"
          className="shrink-0 bg-purple hover:bg-white hover:text-purple text-white font-semibold text-[12px] uppercase tracking-[0.06em] px-4 py-2.5 rounded-lg transition-colors shadow-leap"
        >
          Talk to a Leap counselor →
        </a>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────

function Footer({
  report,
  onOpenMethodology,
}: {
  report: ReviewReportType;
  onOpenMethodology: () => void;
}) {
  return (
    <footer className="px-6 py-3 text-[10px] text-ink-faint flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        {report.stageTimings.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-purple" />
            <span className="uppercase tracking-[0.06em] font-semibold">
              {t.stage}
            </span>
            <span className="num text-ink-muted">{t.ms}ms</span>
          </span>
        ))}
      </div>
      <button
        onClick={onOpenMethodology}
        className="text-purple hover:text-navy transition-colors font-semibold whitespace-nowrap"
      >
        How the pipeline works →
      </button>
    </footer>
  );
}
