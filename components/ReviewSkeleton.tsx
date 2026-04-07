// Loading skeleton for the review report. Mirrors the ReviewReport layout
// so the transition feels stable.
//
// Accepts an optional `progress` prop. When provided, shows real per-stage
// progress fed by the streaming endpoint instead of a static footer.

export type StageId = "cliche-scan" | "scoring" | "annotation";
export type StageStatus = "pending" | "running" | "done";

export interface StageProgress {
  id: StageId;
  label: string;
  status: StageStatus;
  ms?: number;
}

const DEFAULT_STAGES: StageProgress[] = [
  { id: "cliche-scan", label: "Scanning for clichés", status: "pending" },
  { id: "scoring", label: "Scoring against admitted baseline", status: "pending" },
  { id: "annotation", label: "Annotating issues in your draft", status: "pending" },
];

export function ReviewSkeleton({
  progress,
}: {
  progress?: StageProgress[];
} = {}) {
  const stages = progress ?? DEFAULT_STAGES;
  return (
    <div className="bg-white border border-rule rounded-xl shadow-card overflow-hidden animate-fadeIn">
      <div className="border-b border-rule px-6 py-5">
        <Bar w="w-32" h="h-3" />
        <div className="mt-2">
          <Bar w="w-72" h="h-7" />
        </div>
        <div className="mt-2">
          <Bar w="w-96" h="h-3" />
        </div>
      </div>
      <div className="border-b border-rule px-6 py-5 bg-purple-tint/40">
        <Bar w="w-24" h="h-3" />
        <div className="mt-2 space-y-1.5">
          <Bar w="w-full" h="h-4" />
          <Bar w="w-3/4" h="h-4" />
        </div>
      </div>
      <div className="border-b border-rule px-6 py-5">
        <Bar w="w-40" h="h-3" />
        <div className="mt-3 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bar w="w-32" h="h-3" />
              <div className="flex-1">
                <Bar w="w-full" h="h-2" />
              </div>
              <Bar w="w-10" h="h-3" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-5">
        <Bar w="w-40" h="h-3" />
        <div className="mt-3 space-y-2">
          {[...Array(8)].map((_, i) => (
            <Bar key={i} w="w-full" h="h-3" />
          ))}
        </div>
      </div>
      <div className="px-6 py-3 border-t border-rule">
        <ProgressStrip stages={stages} />
      </div>
    </div>
  );
}

function ProgressStrip({ stages }: { stages: StageProgress[] }) {
  return (
    <div className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.06em] font-semibold flex-wrap">
      {stages.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <StageDot status={s.status} />
          <span
            className={
              s.status === "done"
                ? "text-ink"
                : s.status === "running"
                  ? "text-purple"
                  : "text-ink-faint"
            }
          >
            {s.label}
          </span>
          {s.status === "done" && typeof s.ms === "number" && (
            <span className="text-ink-faint num normal-case tracking-normal">
              {s.ms}ms
            </span>
          )}
          {i < stages.length - 1 && (
            <span className="text-ink-faint">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

function StageDot({ status }: { status: StageStatus }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-success text-white text-[8px] font-bold">
        ✓
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border-2 border-purple border-t-transparent animate-spin" />
    );
  }
  return <span className="inline-block w-3.5 h-3.5 rounded-full border border-rule" />;
}

function Bar({ w, h }: { w: string; h: string }) {
  return (
    <div
      className={`${w} ${h} rounded animate-shimmer`}
      style={{
        background:
          "linear-gradient(90deg, #EFEEFF 0%, #F5F5F5 50%, #EFEEFF 100%)",
        backgroundSize: "800px 100%",
      }}
    />
  );
}
