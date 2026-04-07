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
    <article className="bg-white rounded-2xl shadow-cardRaised overflow-hidden animate-fadeIn ring-1 ring-rule-soft">
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
      <Footer onOpenMethodology={onOpenMethodology} />
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
  const who = report.studentName ? report.studentName : "Your draft";
  return (
    <header className="px-7 pt-7 pb-6 sm:px-9 sm:pt-9 sm:pb-7">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-micro text-ink-subtle mb-2">
            <span className="font-medium">{who}</span>
            <span className="text-ink-faint">·</span>
            <time className="num" dateTime={report.generatedAt}>
              {dateStr}
            </time>
            {previousReport && (
              <span className="inline-flex items-center gap-1 ml-1 px-2 py-[2px] rounded-full bg-purple text-white text-[9px] font-semibold tracking-[0.04em] uppercase">
                Revision · v2
              </span>
            )}
          </div>
          <h1 className="font-display text-h1 text-navy font-bold">
            SOP for {report.programName}
          </h1>
          <div className="text-caption text-ink-muted mt-1.5">
            {report.university} ·{" "}
            <span className="num text-ink">{report.wordCount}</span> words
            reviewed
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 no-print">
          <HeaderAction onClick={onOpenMethodology} label="How this works" />
          <HeaderAction onClick={onPrint} label="Save as PDF" />
        </div>
      </div>
    </header>
  );
}

function HeaderAction({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="text-caption font-semibold text-ink-muted hover:text-purple hover:bg-purple-wash px-3 py-2 rounded-lg transition-colors"
    >
      {label}
    </button>
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
    <section className="px-7 pb-8 pt-2 sm:px-9">
      <div className="relative bg-purple-wash rounded-2xl px-6 py-6 sm:px-8 sm:py-7">
        <div className="absolute left-0 top-6 bottom-6 w-[3px] bg-purple rounded-r-full" />
        <div className="pl-4 sm:pl-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-eyebrow text-ink font-semibold bg-white rounded-full px-2.5 py-[3px] ring-1 ring-rule">
              <span className={`w-1.5 h-1.5 rounded-full ${bandColor}`} />
              {bandLabel}
            </span>
            <span className="text-eyebrow text-ink-faint">
              The honest take
            </span>
          </div>
          <p className="font-display text-h2 text-navy font-semibold max-w-[640px]">
            {report.verdict}
          </p>

          <div className="dotted-rule h-[2px] my-6" />

          <PercentileStat report={report} previousReport={previousReport} />
        </div>
      </div>
    </section>
  );
}

function PercentileStat({
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
  const suffix = ordinalSuffix(asIs);
  return (
    <div>
      <div className="flex items-end gap-6 flex-wrap">
        <div>
          <div className="text-eyebrow text-ink-subtle mb-1">
            Your position vs. admitted Indian applicants
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-display font-bold text-navy text-display num leading-none">
              {asIs}
              <span className="text-h3 text-ink-subtle font-semibold">
                {suffix}
              </span>
            </span>
            <span className="text-body text-ink-muted">percentile as-is</span>
          </div>
          {delta > 0 && (
            <div className="text-caption text-purple font-semibold mt-1">
              +{delta} pts → {withFixes}
              {ordinalSuffix(withFixes)} after the fixes below
            </div>
          )}
          {revisionDelta !== null && revisionDelta !== 0 && (
            <div
              className={`inline-flex items-center gap-1 mt-1.5 text-caption font-semibold num ${
                revisionDelta > 0 ? "text-success" : "text-danger"
              }`}
            >
              <span aria-hidden>{revisionDelta > 0 ? "▲" : "▼"}</span>
              {Math.abs(revisionDelta)} pts vs. v1
            </div>
          )}
        </div>
      </div>

      {/* bar */}
      <div className="mt-5 max-w-[560px]">
        <div
          className="relative h-[8px] bg-white/70 rounded-full ring-1 ring-rule overflow-visible"
          role="img"
          aria-label={`${asIs}th percentile, projected ${withFixes}th after fixes`}
        >
          <div
            className="absolute inset-y-0 left-0 bg-purple-pale rounded-full bar-grow"
            style={{ width: `${withFixes}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-purple rounded-full bar-grow"
            style={{ width: `${asIs}%`, animationDelay: "80ms" }}
          />
          <div
            className="absolute -top-1 -bottom-1 w-[2px] bg-navy/80"
            style={{ left: "50%" }}
            aria-hidden
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-ink-faint num">
          <span>Bottom</span>
          <span className="font-semibold text-navy normal-case tracking-normal">
            Median admit
          </span>
          <span>Top</span>
        </div>
      </div>

      <p className="text-body text-ink-muted mt-4 max-w-[640px]">
        {report.percentileStatement}
      </p>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

// ── Shared section shell ───────────────────────────────────

function Section({
  title,
  meta,
  children,
  tone = "default",
  className = "",
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "hushed";
  className?: string;
}) {
  return (
    <section
      className={`px-7 sm:px-9 py-7 sm:py-8 border-t border-rule-soft ${
        tone === "hushed" ? "bg-surface" : ""
      } ${className}`}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
        <h2 className="font-display text-h3 text-navy font-bold">{title}</h2>
        {meta && (
          <div className="text-caption text-ink-muted">{meta}</div>
        )}
      </div>
      {children}
    </section>
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
    <Section
      title="Scores against the admitted baseline"
      meta={
        <>
          6 dimensions · 0–10 scale · click any row to lift it
        </>
      }
    >
      <div className="divide-y divide-rule-soft">
        {report.scores.map((s) => (
          <ScoreRow
            key={s.key}
            score={s}
            report={report}
            previousScore={prevByKey.get(s.key) ?? null}
          />
        ))}
      </div>
    </Section>
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
  // Semantic bar colors tuned for contrast on the white card and clear meaning.
  const barColor =
    delta >= 0 ? "bg-purple" : delta >= -1 ? "bg-warn" : "bg-danger";
  const pct = (score.score / 10) * 100;
  const medianPct = (score.admittedMedian / 10) * 100;
  const status: "at" | "near" | "below" =
    delta >= 0 ? "at" : delta >= -1 ? "near" : "below";

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
    <div className="py-4 first:pt-0 last:pb-0">
      {/* Row 1 — label + score chip */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="text-[14px] font-semibold text-navy tracking-tightish">
            {score.label}
          </h3>
          <StatusPill status={status} />
        </div>
        <div className="shrink-0 flex items-baseline gap-2">
          <span className="num font-display font-bold text-h4 text-navy">
            {score.score}
          </span>
          <span className="text-caption text-ink-faint num">
            / {score.admittedMedian} median
          </span>
          {previousScore !== null && previousScore !== score.score && (
            <span
              className={`ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold num ${
                score.score > previousScore ? "text-success" : "text-danger"
              }`}
            >
              <span aria-hidden>{score.score > previousScore ? "▲" : "▼"}</span>
              {Math.abs(score.score - previousScore)}
            </span>
          )}
        </div>
      </div>

      {/* Row 2 — bar */}
      <div className="mt-2.5">
        <div className="relative h-[6px] bg-surface-sunken rounded-full overflow-visible">
          <div
            className={`absolute inset-y-0 left-0 ${barColor} rounded-full bar-grow`}
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute -top-[3px] -bottom-[3px] w-[2px] bg-navy/60 rounded-full"
            style={{ left: `${medianPct}%` }}
            aria-label={`Admitted median ${score.admittedMedian}`}
          />
        </div>
      </div>

      {/* Row 3 — rationale + lift action */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <p className="text-body text-ink-muted max-w-[680px]">
          {score.rationale}
        </p>
        <button
          type="button"
          onClick={handleToggle}
          className="shrink-0 text-caption font-semibold text-purple hover:text-navy transition-colors no-print inline-flex items-center gap-1"
          aria-expanded={open}
        >
          {open ? "Hide" : "Lift this score"}
          <span
            aria-hidden
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            ↓
          </span>
        </button>
      </div>

      {/* Row 4 — drilldown panel */}
      {open && (
        <div className="mt-3 rounded-xl bg-purple-wash ring-1 ring-purple-pale/60 px-4 py-3.5 text-body text-navy">
          {loading && (
            <div className="inline-flex items-center gap-2 text-ink-muted">
              <span className="inline-block w-3 h-3 border-2 border-purple border-t-transparent rounded-full animate-spin" />
              Reading your draft…
            </div>
          )}
          {error && <div className="text-danger">{error}</div>}
          {answer && <div className="whitespace-pre-wrap">{answer}</div>}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "at" | "near" | "below" }) {
  const cfg = {
    at: {
      label: "At baseline",
      cls: "bg-purple-wash text-purple ring-purple-pale/70",
    },
    near: {
      label: "1 below",
      cls: "bg-warn-tint text-warn ring-warn/30",
    },
    below: {
      label: "Below baseline",
      cls: "bg-danger-tint text-danger ring-danger/25",
    },
  }[status];
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.06em] font-semibold px-1.5 py-[2px] rounded-md ring-1 ${cfg.cls}`}
    >
      {cfg.label}
    </span>
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
  const totalFlags = report.flags.length;

  return (
    <Section
      title="Your draft, annotated"
      meta={
        totalFlags === 0 ? (
          "No issues flagged — tight draft."
        ) : (
          <span className="inline-flex items-center gap-2.5">
            <span className="num font-semibold text-navy">{totalFlags}</span>{" "}
            issues flagged
            <span className="inline-flex items-center gap-2">
              <SevPill count={sevCount.high} label="High" tone="danger" />
              <SevPill count={sevCount.medium} label="Med" tone="warn" />
              <SevPill count={sevCount.low} label="Low" tone="muted" />
            </span>
          </span>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="relative">
          <div className="rounded-xl ring-1 ring-rule-soft bg-white px-6 py-5 sm:px-7 sm:py-6 text-[14.5px] leading-[1.8] text-ink-strong whitespace-pre-wrap font-sans">
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
                  className={`cursor-pointer transition-colors rounded-[3px] -mx-[1px] px-[1px] ${flagClasses(seg.severity, isActive)}`}
                >
                  {seg.text}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          {activeFlag ? (
            <div className="rounded-xl ring-1 ring-rule bg-white p-5 shadow-card">
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${sevDotClass(activeFlag.severity)}`}
                />
                <span className="text-eyebrow text-ink-subtle">
                  {prettyCategory(activeFlag.category)} ·{" "}
                  {activeFlag.severity} severity
                </span>
              </div>
              <div className="font-display text-[15px] text-navy font-semibold leading-snug mb-2">
                &ldquo;{truncate(activeFlag.phrase, 90)}&rdquo;
              </div>
              <p className="text-body text-ink-muted">
                {activeFlag.why}
              </p>
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="mt-3 text-caption font-semibold text-purple hover:text-navy transition-colors no-print"
              >
                Close
              </button>
            </div>
          ) : (
            <FlagIndex
              flags={report.flags}
              onSelect={onSelect}
            />
          )}
        </aside>
      </div>
    </Section>
  );
}

function FlagIndex({
  flags,
  onSelect,
}: {
  flags: FlagAnnotation[];
  onSelect: (i: number | null) => void;
}) {
  if (flags.length === 0) {
    return (
      <div className="rounded-xl ring-1 ring-rule-soft bg-surface p-5 text-body text-ink-muted">
        Nothing flagged. Either this draft is genuinely clean, or the rubric
        for this program is permissive.
      </div>
    );
  }
  return (
    <div className="rounded-xl ring-1 ring-rule-soft bg-white">
      <div className="px-4 pt-3.5 pb-2 text-eyebrow text-ink-subtle">
        Jump to flag
      </div>
      <ol className="divide-y divide-rule-soft max-h-[440px] overflow-y-auto">
        {flags.map((f, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="w-full text-left px-4 py-2.5 hover:bg-purple-wash transition-colors flex items-start gap-2.5 no-print"
            >
              <span
                className={`mt-[6px] w-1.5 h-1.5 rounded-full shrink-0 ${sevDotClass(f.severity)}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] uppercase tracking-[0.08em] font-semibold text-ink-subtle mb-0.5">
                  {prettyCategory(f.category)}
                </span>
                <span className="block text-caption text-navy font-medium truncate">
                  &ldquo;{truncate(f.phrase, 60)}&rdquo;
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
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
  // Editorial highlight — soft background fill with a thin underline accent,
  // instead of loud colored text. Reads like a copy edit, not a terminal.
  const base =
    severity === "high"
      ? "bg-danger-tint/80 text-ink-strong [text-decoration:underline] decoration-danger/70 decoration-[1.5px] underline-offset-[3px] hover:bg-danger-tint"
      : severity === "medium"
        ? "bg-warn-tint/80 text-ink-strong [text-decoration:underline] decoration-warn/70 decoration-[1.5px] underline-offset-[3px] hover:bg-warn-tint"
        : "bg-surface-sunken text-ink-strong [text-decoration:underline] decoration-ink-faint/60 decoration-[1.5px] underline-offset-[3px] hover:bg-rule-soft";
  const activeRing = active
    ? severity === "high"
      ? "ring-1 ring-danger/50 bg-danger-tint"
      : severity === "medium"
        ? "ring-1 ring-warn/50 bg-warn-tint"
        : "ring-1 ring-ink-faint/30 bg-rule-soft"
    : "";
  return `${base} ${activeRing}`;
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
  tone,
}: {
  count: number;
  label: string;
  tone: "danger" | "warn" | "muted";
}) {
  if (count === 0) return null;
  const cls =
    tone === "danger"
      ? "bg-danger-tint text-danger"
      : tone === "warn"
        ? "bg-warn-tint text-warn"
        : "bg-surface-sunken text-ink-muted";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-[2px] text-[10px] uppercase tracking-[0.06em] font-semibold ${cls}`}
    >
      <span className="num">{count}</span> {label}
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
  const total = report.missingItems.length;
  const missing = report.missingItems.filter((i) => !i.present);
  return (
    <Section
      title="What admitted SOPs usually have"
      meta={
        <>
          <span className="num font-semibold text-navy">
            {presentCount}
          </span>
          <span className="text-ink-faint"> / </span>
          <span className="num text-ink-muted">{total}</span> present in this
          draft
        </>
      }
    >
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
        {report.missingItems.map((m, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              aria-hidden
              className={`mt-[5px] shrink-0 w-[14px] h-[14px] rounded-full inline-flex items-center justify-center ${
                m.present
                  ? "bg-success text-white"
                  : "bg-white ring-1 ring-rule-strong"
              }`}
            >
              {m.present && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M1.5 4.2L3.2 5.8L6.5 2.2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              className={`text-body ${m.present ? "text-ink-strong" : "text-ink-muted"}`}
            >
              {m.label}
            </span>
          </li>
        ))}
      </ul>
      {missing.length > 0 && (
        <p className="mt-5 text-caption text-ink-muted max-w-[640px]">
          The missing items aren&apos;t mandatory, but admitted drafts at{" "}
          <span className="text-navy font-medium">{report.programName}</span>{" "}
          almost always earn at least one of them on the page.
        </p>
      )}
    </Section>
  );
}

// ── Action plan ────────────────────────────────────────────

function ActionPlan({ report }: { report: ReviewReportType }) {
  if (!report.actionPlan || report.actionPlan.length === 0) return null;
  return (
    <Section
      title="The three things to fix next"
      meta="Work in order. #1 moves the percentile most."
    >
      <ol className="space-y-3">
        {report.actionPlan.map((item, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-xl ring-1 ring-rule-soft bg-white px-5 py-4 hover:ring-purple-pale transition-colors"
          >
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-purple-wash ring-1 ring-purple-pale text-purple font-display font-bold text-[13px] flex items-center justify-center num">
                {i + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-navy font-semibold leading-snug tracking-tightish">
                {item.action}
              </div>
              <div className="text-body text-ink-muted mt-1.5">
                {item.why}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ── Leap counselor CTA ─────────────────────────────────────

function CounselorCTA() {
  return (
    <section className="px-7 sm:px-9 py-7 border-t border-rule-soft bg-navy text-white no-print relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-purple/25 blur-3xl"
      />
      <div className="relative flex items-center justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0 max-w-[560px]">
          <div className="eyebrow !text-purple-pale mb-2">
            After you&apos;ve revised
          </div>
          <h2 className="font-display text-h3 font-bold tracking-tightish">
            Want a Leap counselor to read your next draft?
          </h2>
          <p className="text-body text-white/70 mt-2">
            A human who has reviewed hundreds of SOPs at this exact program.
            Free 30-minute call. No pitch, no pressure.
          </p>
        </div>
        <a
          href="https://leapscholar.com/counsellors"
          target="_blank"
          rel="noreferrer noopener"
          className="shrink-0 inline-flex items-center gap-2 bg-white hover:bg-purple-pale text-navy font-semibold text-caption px-5 py-3 rounded-lg transition-colors"
        >
          Book a free call
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────

function Footer({
  onOpenMethodology,
}: {
  onOpenMethodology: () => void;
}) {
  return (
    <footer className="px-7 sm:px-9 py-5 text-micro text-ink-subtle flex items-center justify-between gap-4 flex-wrap border-t border-rule-soft">
      <div className="max-w-[560px] leading-relaxed">
        Scored against Leap&apos;s admitted-Indian-applicant baseline. No
        draft data is stored.
      </div>
      <button
        onClick={onOpenMethodology}
        className="text-purple hover:text-navy transition-colors font-semibold whitespace-nowrap no-print"
      >
        How the review works →
      </button>
    </footer>
  );
}
