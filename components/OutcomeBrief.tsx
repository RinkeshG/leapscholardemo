import type { Brief, GenerateBriefResponse } from "@/lib/types";

interface Props {
  data: GenerateBriefResponse;
}

export function OutcomeBrief({ data }: Props) {
  const { brief, source } = data;
  return (
    <article className="bg-white border border-rule">
      <Header brief={brief} source={source} />
      <Verdict brief={brief} />
      <RecommendationsTable brief={brief} />
      <RisksPanel brief={brief} />
      <Footer />
    </article>
  );
}

function Header({ brief, source }: { brief: Brief; source: "live" | "fixture" }) {
  const date = new Date(brief.generatedAt);
  const dateStr = date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <header className="border-b border-rule px-6 py-4 flex items-baseline justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          Outcome Brief · Leap Scholar
        </div>
        <h1 className="text-[22px] font-semibold tracking-tightish text-navy mt-0.5">
          {brief.studentName}
        </h1>
        <div className="text-[12px] text-ink-muted mt-0.5">
          {brief.profileSummary}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          Generated
        </div>
        <div className="text-[12px] text-ink num">{dateStr}</div>
        <div
          className={`text-[9px] uppercase tracking-[0.1em] mt-1 ${
            source === "live" ? "text-safety" : "text-ink-faint"
          }`}
        >
          {source === "live" ? "● Live model" : "○ Fixture mode"}
        </div>
      </div>
    </header>
  );
}

function Verdict({ brief }: { brief: Brief }) {
  return (
    <section className="border-b border-rule px-6 py-4 bg-surface">
      <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint mb-1">
        Verdict
      </div>
      <p className="text-[15px] text-navy leading-snug font-medium">
        {brief.verdict}
      </p>
    </section>
  );
}

function RecommendationsTable({ brief }: { brief: Brief }) {
  return (
    <section className="border-b border-rule">
      <div className="px-6 pt-4 pb-2 flex items-baseline justify-between">
        <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          University recommendations
        </div>
        <div className="text-[10px] text-ink-faint">
          {brief.recommendations.length} schools · adjusted for profile
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.06em] text-ink-faint border-y border-rule">
              <Th align="left">University</Th>
              <Th align="left">Program</Th>
              <Th>Fit</Th>
              <Th>Admit %</Th>
              <Th>Visa %</Th>
              <Th>Empl %</Th>
              <Th>Med Salary</Th>
              <Th>2-yr ROI</Th>
              <Th>Total Cost</Th>
            </tr>
          </thead>
          <tbody>
            {brief.recommendations.map((r) => (
              <tr
                key={r.universityId}
                className="border-b border-rule last:border-b-0 hover:bg-surface"
              >
                <td className="px-6 py-2.5">
                  <div className="font-medium text-navy">{r.name}</div>
                  <div className="text-[10px] text-ink-faint uppercase tracking-wider">
                    {r.country}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-ink-muted">{r.program}</td>
                <td className="px-3 py-2.5 text-center">
                  <FitBadge band={r.fitBand} />
                </td>
                <td className="px-3 py-2.5 text-right num">
                  {pct(r.admitProbability)}
                </td>
                <td className="px-3 py-2.5 text-right num">
                  {pct(r.visaApprovalRate)}
                </td>
                <td className="px-3 py-2.5 text-right num">
                  {pct(r.employmentRateWithin6Mo)}
                </td>
                <td className="px-3 py-2.5 text-right num">
                  ${(r.medianStartingSalaryUsd / 1000).toFixed(0)}k
                </td>
                <td
                  className={`px-3 py-2.5 text-right num ${
                    r.twoYearRoiPct >= 100 ? "text-safety" : "text-ink"
                  }`}
                >
                  {r.twoYearRoiPct >= 0 ? "+" : ""}
                  {r.twoYearRoiPct.toFixed(0)}%
                </td>
                <td className="px-6 py-2.5 text-right num">
                  ₹{(r.totalCostInr / 100000).toFixed(1)}L
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RisksPanel({ brief }: { brief: Brief }) {
  return (
    <section className="px-6 py-4 border-b border-rule">
      <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint mb-2">
        Risk flags · profile-specific
      </div>
      <div className="space-y-2.5">
        {brief.risks.map((r, i) => (
          <div key={i} className="flex gap-3">
            <SeverityDot severity={r.severity} />
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-navy">{r.title}</div>
              <div className="text-[11px] text-ink-muted leading-snug mt-0.5">
                {r.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-3 text-[10px] text-ink-faint italic leading-snug">
      Demo data. The production version of this product queries Leap&apos;s
      outcomes warehouse — admit decisions, visa results, employment outcomes,
      and loan repayment data — across 250,000+ Indian student records, 2021–2025.
      All numbers shown here are model-generated approximations for
      demonstration purposes only.
    </footer>
  );
}

// ── primitives ─────────────────────────────────────────────

function Th({
  children,
  align = "right",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  const cls =
    align === "left"
      ? "text-left px-6 py-2"
      : align === "center"
        ? "text-center px-3 py-2"
        : "text-right px-3 py-2";
  return <th className={`${cls} font-normal`}>{children}</th>;
}

function FitBadge({ band }: { band: "Reach" | "Target" | "Safety" }) {
  const color =
    band === "Reach"
      ? "text-reach border-reach"
      : band === "Target"
        ? "text-target border-target"
        : "text-safety border-safety";
  return (
    <span
      className={`text-[9px] uppercase tracking-[0.08em] border px-1.5 py-[1px] ${color}`}
    >
      {band}
    </span>
  );
}

function SeverityDot({ severity }: { severity: "low" | "medium" | "high" }) {
  const color =
    severity === "high"
      ? "bg-reach"
      : severity === "medium"
        ? "bg-accent"
        : "bg-target";
  return (
    <div className="pt-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
    </div>
  );
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
