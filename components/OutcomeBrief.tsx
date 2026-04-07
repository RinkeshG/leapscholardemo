"use client";

import { useMemo, useState } from "react";
import type {
  ActionItem,
  EdgeMove,
  OutcomeBrief as OutcomeBriefType,
} from "@/lib/brief-types";
import type { ProgramScore, RiskFlag } from "@/lib/scoring";
import type { StudentProfile } from "@/lib/profile";
import { COLLEGE_TIER_LABEL, WORK_BUCKET_LABEL } from "@/lib/profile";
import { ProgramDrilldown } from "./ProgramDrilldown";

interface Props {
  brief: OutcomeBriefType;
  onOpenMethodology: () => void;
}

export function OutcomeBrief({ brief, onOpenMethodology }: Props) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const openScore = useMemo(
    () => brief.portfolio.find((p) => p.university.id === openProgramId),
    [brief.portfolio, openProgramId],
  );
  const openDrilldown = openProgramId
    ? brief.drilldowns[openProgramId]
    : undefined;

  return (
    <>
      <article className="bg-white rounded-2xl shadow-cardRaised overflow-hidden ring-1 ring-rule-soft animate-fadeIn">
        <Header brief={brief} onOpenMethodology={onOpenMethodology} />
        <Verdict brief={brief} />
        <BetSheet
          portfolio={brief.portfolio}
          onSelect={(id) => setOpenProgramId(id)}
        />
        <EdgeMovesSection moves={brief.edgeMoves} />
        <RiskFlagsSection flags={brief.riskFlags} />
        <ActionPlanSection items={brief.actionPlan} />
        <CounselorCTA />
        <Footer onOpenMethodology={onOpenMethodology} />
      </article>

      {openScore && openDrilldown && (
        <ProgramDrilldown
          score={openScore}
          drilldown={openDrilldown}
          onClose={() => setOpenProgramId(null)}
        />
      )}
    </>
  );
}

// ── Header ─────────────────────────────────────────────────

function Header({
  brief,
  onOpenMethodology,
}: {
  brief: OutcomeBriefType;
  onOpenMethodology: () => void;
}) {
  const date = new Date(brief.generatedAt);
  const dateStr = date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const who = brief.studentName || "Your outcome brief";
  return (
    <header className="px-7 pt-7 pb-6 sm:px-9 sm:pt-9 sm:pb-7">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-micro text-ink-subtle mb-2">
            <span className="font-medium">{who}</span>
            <span className="text-ink-faint">·</span>
            <time className="num" dateTime={brief.generatedAt}>
              {dateStr}
            </time>
          </div>
          <h1 className="font-display text-h1 text-navy font-bold">
            Your bet, read honestly
          </h1>
          <div className="text-caption text-ink-muted mt-1.5">
            <ProfileInline profile={brief.profile} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 no-print">
          <HeaderAction onClick={onOpenMethodology} label="How this works" />
          <HeaderAction onClick={() => window.print()} label="Save as PDF" />
        </div>
      </div>
    </header>
  );
}

function ProfileInline({ profile }: { profile: StudentProfile }) {
  const parts = [
    `${profile.cgpa.toFixed(1)} CGPA`,
    COLLEGE_TIER_LABEL[profile.collegeTier],
    profile.gre ? `GRE ${profile.gre}` : "no GRE",
    profile.workExperienceYears > 0
      ? `${profile.workExperienceYears}y ${WORK_BUCKET_LABEL[profile.workExperienceBucket]}`
      : "no work exp",
    `$${Math.round(profile.budgetUSDCap / 1000)}K budget`,
  ];
  return <>{parts.join(" · ")}</>;
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

function Verdict({ brief }: { brief: OutcomeBriefType }) {
  const band = verdictBand(brief.verdictBand);
  return (
    <section className="px-7 pb-8 pt-2 sm:px-9">
      <div className="relative bg-purple-wash rounded-2xl px-6 py-6 sm:px-8 sm:py-7">
        <div className="absolute left-0 top-6 bottom-6 w-[3px] bg-purple rounded-r-full" />
        <div className="pl-4 sm:pl-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-eyebrow text-ink font-semibold bg-white rounded-full px-2.5 py-[3px] ring-1 ring-rule">
              <span className={`w-1.5 h-1.5 rounded-full ${band.dot}`} />
              {band.label}
            </span>
            <span className="text-eyebrow text-ink-faint">
              The honest take
            </span>
          </div>
          <p className="font-display text-h2 text-navy font-semibold max-w-[680px]">
            {brief.verdict}
          </p>
        </div>
      </div>
    </section>
  );
}

function verdictBand(b: OutcomeBriefType["verdictBand"]): {
  label: string;
  dot: string;
} {
  switch (b) {
    case "strong-bet":
      return { label: "Strong bet", dot: "bg-success" };
    case "mixed-bet":
      return { label: "Mixed bet", dot: "bg-warn" };
    case "thin-bet":
      return { label: "Thin bet", dot: "bg-warn" };
    case "not-worth-it":
      return { label: "Rethink this", dot: "bg-danger" };
  }
}

// ── Shared Section shell ───────────────────────────────────

function Section({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`px-7 sm:px-9 py-7 sm:py-8 border-t border-rule-soft ${className}`}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
        <h2 className="font-display text-h3 text-navy font-bold">{title}</h2>
        {meta && <div className="text-caption text-ink-muted">{meta}</div>}
      </div>
      {children}
    </section>
  );
}

// ── Bet Sheet ──────────────────────────────────────────────

function BetSheet({
  portfolio,
  onSelect,
}: {
  portfolio: ProgramScore[];
  onSelect: (id: string) => void;
}) {
  return (
    <Section
      title="The bet sheet"
      meta={
        <>
          {portfolio.length} programs · ranked by combined admit × visa ×
          ROI · click any row for the detail
        </>
      }
    >
      {/* Header row */}
      <div className="hidden lg:grid grid-cols-[minmax(0,1.8fr)_80px_80px_100px_110px_80px] gap-3 pb-2.5 mb-1 text-micro uppercase tracking-[0.08em] text-ink-subtle font-semibold border-b border-rule-soft">
        <div>Program</div>
        <div className="text-right">Admit</div>
        <div className="text-right">Visa</div>
        <div className="text-right">Total cost</div>
        <div className="text-right">5yr earn</div>
        <div className="text-right">Fit</div>
      </div>

      <div className="divide-y divide-rule-soft">
        {portfolio.map((score) => (
          <BetRow
            key={score.university.id}
            score={score}
            onClick={() => onSelect(score.university.id)}
          />
        ))}
      </div>
    </Section>
  );
}

function BetRow({
  score,
  onClick,
}: {
  score: ProgramScore;
  onClick: () => void;
}) {
  const u = score.university;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left py-4 group hover:bg-purple-wash/50 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="lg:grid lg:grid-cols-[minmax(0,1.8fr)_80px_80px_100px_110px_80px] lg:gap-3 lg:items-baseline">
        {/* Program name + location */}
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-navy tracking-tightish">
            {u.university}
          </div>
          <div className="text-caption text-ink-muted truncate">
            {u.programName} · {u.city}
          </div>
        </div>

        {/* Mobile: show inline numeric strip */}
        <div className="lg:hidden mt-2 flex items-center gap-4 text-caption text-ink-muted">
          <InlineStat
            label="Admit"
            value={`${pct(score.admitProbability)}%`}
          />
          <InlineStat label="Visa" value={`${pct(score.visaProbability)}%`} />
          <InlineStat
            label="Cost"
            value={`$${Math.round(score.totalCostUSD / 1000)}K`}
          />
          <FitBadge fit={score.fitBand} />
        </div>

        {/* Desktop: column-aligned numerics */}
        <div className="hidden lg:block text-right">
          <span className="num text-h4 font-bold text-navy">
            {pct(score.admitProbability)}
          </span>
          <span className="text-micro text-ink-faint">%</span>
        </div>
        <div className="hidden lg:block text-right">
          <span
            className={`num text-h4 font-bold ${
              score.visaProbability < 0.4 ? "text-danger" : "text-navy"
            }`}
          >
            {pct(score.visaProbability)}
          </span>
          <span className="text-micro text-ink-faint">%</span>
        </div>
        <div className="hidden lg:block text-right">
          <div className="num text-[14px] font-semibold text-navy">
            ${Math.round(score.totalCostUSD / 1000)}K
          </div>
          {!score.withinBudget && (
            <div className="text-micro text-danger">over budget</div>
          )}
        </div>
        <div className="hidden lg:block text-right">
          <div className="num text-[14px] font-semibold text-navy">
            ${Math.round(score.fiveYearEarningsUSD / 1000)}K
          </div>
          <div
            className={`text-micro num ${
              score.netROI >= 1
                ? "text-success"
                : score.netROI >= 0
                  ? "text-ink-muted"
                  : "text-danger"
            }`}
          >
            {score.netROI >= 0 ? "+" : ""}
            {Math.round(score.netROI * 100)}% ROI
          </div>
        </div>
        <div className="hidden lg:flex justify-end">
          <FitBadge fit={score.fitBand} />
        </div>
      </div>

      {/* Visa-collapse strip */}
      {score.fitBand === "skip" && score.visaProbability < 0.4 && (
        <div className="mt-2 text-micro text-danger">
          Visa reality for 2026 brings combined odds to{" "}
          <span className="num font-semibold">
            {pct(score.landedProbability)}%
          </span>{" "}
          — recommend skipping.
        </div>
      )}

      <div className="mt-1 text-caption text-purple opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
        Click to see the cohort, cost breakdown, and rationale →
      </div>
    </button>
  );
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-ink-faint">{label}</span>
      <span className="num font-semibold text-navy">{value}</span>
    </span>
  );
}

function FitBadge({ fit }: { fit: ProgramScore["fitBand"] }) {
  const cfg = {
    safety: {
      label: "Safety",
      cls: "bg-success/10 text-success ring-success/30",
    },
    target: {
      label: "Target",
      cls: "bg-purple-wash text-purple ring-purple-pale",
    },
    reach: {
      label: "Reach",
      cls: "bg-warn-tint text-warn ring-warn/30",
    },
    skip: {
      label: "Skip",
      cls: "bg-danger-tint text-danger ring-danger/25",
    },
  }[fit];
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-[3px] rounded-md ring-1 whitespace-nowrap ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

function pct(x: number): number {
  return Math.round(x * 100);
}

// ── Edge Moves ─────────────────────────────────────────────

function EdgeMovesSection({ moves }: { moves: EdgeMove[] }) {
  if (moves.length === 0) return null;
  return (
    <Section
      title="Three moves your counselor won't make"
      meta="Non-obvious recommendations your profile justifies."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moves.map((m, i) => (
          <EdgeMoveCard key={i} move={m} />
        ))}
      </div>
    </Section>
  );
}

function EdgeMoveCard({ move }: { move: EdgeMove }) {
  const kindCfg = {
    "alternate-bet": {
      label: "Alternate bet",
      accent: "bg-purple",
      wash: "bg-purple-wash ring-purple-pale",
    },
    "budget-trap": {
      label: "Budget trap",
      accent: "bg-danger",
      wash: "bg-danger-tint ring-danger/30",
    },
    "visa-reality": {
      label: "Visa reality",
      accent: "bg-warn",
      wash: "bg-warn-tint ring-warn/30",
    },
    "cost-hack": {
      label: "Cost hack",
      accent: "bg-success",
      wash: "bg-success/10 ring-success/30",
    },
  }[move.kind];
  return (
    <div className={`rounded-xl ring-1 p-5 ${kindCfg.wash}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${kindCfg.accent}`} />
        <span className="text-eyebrow text-ink-subtle">{kindCfg.label}</span>
      </div>
      <div className="font-display text-[15px] text-navy font-semibold leading-snug mb-2">
        {move.headline}
      </div>
      <p className="text-body text-ink-muted">{move.body}</p>
    </div>
  );
}

// ── Risk Flags ─────────────────────────────────────────────

function RiskFlagsSection({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <Section
      title="Risk flags we'd talk through with you"
      meta={`${flags.length} flag${flags.length === 1 ? "" : "s"} worth a real conversation`}
    >
      <ul className="space-y-3">
        {flags.map((f, i) => (
          <li
            key={i}
            className="risk-item flex gap-3.5 rounded-xl ring-1 ring-rule-soft bg-white px-5 py-4"
          >
            <div className="shrink-0 mt-[6px]">
              <SeverityDot severity={f.severity} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-navy leading-snug tracking-tightish">
                {f.title}
              </div>
              <p className="text-body text-ink-muted mt-1">{f.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function SeverityDot({ severity }: { severity: RiskFlag["severity"] }) {
  const cls = {
    high: "bg-danger",
    medium: "bg-warn",
    low: "bg-ink-faint",
  }[severity];
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${cls}`}
      aria-label={`${severity} severity`}
    />
  );
}

// ── Action Plan ────────────────────────────────────────────

function ActionPlanSection({ items }: { items: ActionItem[] }) {
  return (
    <Section
      title="The three things to do next"
      meta="In order. #1 moves your portfolio most."
    >
      <ol className="space-y-3">
        {items.map((item) => (
          <li
            key={item.priority}
            className="flex gap-4 rounded-xl ring-1 ring-rule-soft bg-white px-5 py-4 hover:ring-purple-pale transition-colors"
          >
            <div className="shrink-0">
              <div className="w-7 h-7 rounded-full bg-purple-wash ring-1 ring-purple-pale text-purple font-display font-bold text-[13px] flex items-center justify-center num">
                {item.priority}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-navy font-semibold leading-snug tracking-tightish">
                {item.action}
              </div>
              <div className="text-body text-ink-muted mt-1.5">{item.why}</div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ── Counselor CTA ──────────────────────────────────────────

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
            Once you've picked your bets
          </div>
          <h2 className="font-display text-h3 font-bold tracking-tightish">
            Take this brief to a Leap counselor
          </h2>
          <p className="text-body text-white/70 mt-2">
            A human who's walked hundreds of Indian students through this
            exact decision. Show them this page and ask them to argue with
            it. Free 30-minute call. No pitch.
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

function Footer({ onOpenMethodology }: { onOpenMethodology: () => void }) {
  return (
    <footer className="px-7 sm:px-9 py-5 text-micro text-ink-subtle flex items-center justify-between gap-4 flex-wrap border-t border-rule-soft">
      <div className="max-w-[600px] leading-relaxed">
        Admit and visa probabilities are calibrated against Leap's baseline of
        Indian applicant outcomes over the last three admission cycles. No
        draft data is stored.
      </div>
      <button
        onClick={onOpenMethodology}
        className="text-purple hover:text-navy transition-colors font-semibold whitespace-nowrap no-print"
      >
        How the math works →
      </button>
    </footer>
  );
}
