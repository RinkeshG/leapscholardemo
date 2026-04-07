"use client";

import { useEffect } from "react";
import type { ProgramDrilldown as Drilldown } from "@/lib/brief-types";
import type { ProgramScore } from "@/lib/scoring";

interface Props {
  score: ProgramScore;
  drilldown: Drilldown;
  onClose: () => void;
}

export function ProgramDrilldown({ score, drilldown, onClose }: Props) {
  // Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const u = score.university;
  const totalCost = drilldown.costBreakdown.reduce(
    (acc, l) => acc + l.amountUSD,
    0,
  );

  return (
    <div className="fixed inset-0 z-40 no-print">
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 scrim animate-fadeIn"
      />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-cardRaised overflow-y-auto animate-slideIn">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-rule-soft px-7 py-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="eyebrow text-ink-subtle mb-1.5">
              Program drilldown
            </div>
            <h2 className="font-display text-h3 text-navy font-bold tracking-tightish leading-snug">
              {u.university}
            </h2>
            <div className="text-caption text-ink-muted mt-1">
              {u.programName} · {u.city}, {u.country}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drilldown"
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-purple-wash hover:text-purple transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
            >
              <path
                d="M2 2l10 10M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Headline grid */}
        <div className="px-7 py-6 grid grid-cols-3 gap-3">
          <NumberStat
            label="Admit"
            value={`${pct(score.admitProbability)}%`}
            tone={score.admitProbability >= 0.25 ? "good" : "warn"}
          />
          <NumberStat
            label="Visa"
            value={`${pct(score.visaProbability)}%`}
            tone={score.visaProbability >= 0.65 ? "good" : "danger"}
          />
          <NumberStat
            label="Combined"
            value={`${pct(score.landedProbability)}%`}
            tone={score.landedProbability >= 0.2 ? "good" : "warn"}
          />
        </div>

        {/* Rationale */}
        <Section title="Why this number">
          <p className="text-body text-ink-muted leading-relaxed">
            {drilldown.rationale}
          </p>
        </Section>

        {/* Profile adjustments */}
        {score.profileAdjustments.length > 0 && (
          <Section
            title="How your profile moved the baseline"
            meta={`${u.baselineAdmitRate * 100}% baseline → ${pct(score.admitProbability)}% adjusted`}
          >
            <ul className="space-y-2.5">
              {score.profileAdjustments.map((adj, i) => (
                <li
                  key={i}
                  className="text-body text-ink-muted leading-relaxed flex gap-3"
                >
                  <span className="shrink-0 mt-[9px] w-1 h-1 rounded-full bg-purple" />
                  <span>{adj}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Cost breakdown */}
        <Section title="What it actually costs" meta="USD, 4-year program horizon">
          <div className="rounded-xl ring-1 ring-rule-soft overflow-hidden">
            {drilldown.costBreakdown.map((line, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between px-4 py-2.5 border-b border-rule-soft last:border-b-0 text-body"
              >
                <span className="text-ink-muted">{line.label}</span>
                <span className="num font-semibold text-navy">
                  ${line.amountUSD.toLocaleString("en-US")}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between px-4 py-3 bg-purple-wash text-[14px] font-semibold">
              <span className="text-navy">Total</span>
              <span className="num text-navy">
                ${totalCost.toLocaleString("en-US")}
              </span>
            </div>
          </div>
          <div className="text-caption text-ink-subtle mt-2.5 leading-relaxed">
            Median starting salary at {u.university} for Indian graduates is
            <span className="num font-semibold text-navy">
              {" "}
              ${Math.round(u.medianStartingSalaryUSD / 1000)}K
            </span>
            , 6-month employment rate{" "}
            <span className="num font-semibold text-navy">
              {Math.round(u.employmentRate6Mo * 100)}%
            </span>
            . Net 5-year ROI works out to{" "}
            <span
              className={`num font-semibold ${
                score.netROI >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {score.netROI >= 4
                ? `${(score.netROI + 1).toFixed(1)}x payback`
                : `${score.netROI >= 0 ? "+" : ""}${Math.round(score.netROI * 100)}%`}
            </span>
            .
          </div>
        </Section>

        {/* Comparable students */}
        <Section
          title="Students like you who applied here"
          meta={`Drawn from ~${score.cohortSizeApprox} comparable Leap profiles`}
        >
          <ul className="space-y-3">
            {drilldown.comparableStudents.map((s, i) => (
              <li
                key={i}
                className="rounded-xl ring-1 ring-rule-soft bg-white px-4 py-3.5"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-display font-bold text-navy text-[14px]">
                      {s.initials}
                    </span>
                    <span className="text-caption text-ink-subtle truncate">
                      {s.profileSummary}
                    </span>
                  </div>
                  <OutcomePill outcome={s.outcome} />
                </div>
                <div className="text-body text-ink-muted leading-relaxed mt-1.5">
                  {s.thenWhatHappened}
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* Indian cohort notes */}
        {u.indianCohortNotes && (
          <Section title="What only a Leap counselor knows">
            <p className="text-body text-ink-muted leading-relaxed">
              {u.indianCohortNotes}
            </p>
          </Section>
        )}

        <div className="h-8" />
      </aside>
    </div>
  );
}

// ────────────────────────────────────────────────────────────

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-7 py-6 border-t border-rule-soft">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <h3 className="font-display text-[15px] text-navy font-bold tracking-tightish">
          {title}
        </h3>
        {meta && <div className="text-micro text-ink-subtle">{meta}</div>}
      </div>
      {children}
    </section>
  );
}

function NumberStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "danger";
}) {
  const cls = {
    good: "text-navy",
    warn: "text-warn",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-xl ring-1 ring-rule-soft bg-white px-4 py-3">
      <div className="text-eyebrow text-ink-subtle mb-1">{label}</div>
      <div className={`num font-display font-bold text-h2 ${cls}`}>
        {value}
      </div>
    </div>
  );
}

function OutcomePill({
  outcome,
}: {
  outcome: "admitted" | "rejected" | "waitlisted";
}) {
  const cfg = {
    admitted: {
      label: "Admitted",
      cls: "bg-success/10 text-success ring-success/30",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-danger-tint text-danger ring-danger/25",
    },
    waitlisted: {
      label: "Waitlisted",
      cls: "bg-warn-tint text-warn ring-warn/30",
    },
  }[outcome];
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-[3px] rounded-md ring-1 whitespace-nowrap shrink-0 ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

function pct(x: number): number {
  return Math.round(x * 100);
}
