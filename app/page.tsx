"use client";

import { useState } from "react";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewReport } from "@/components/ReviewReport";
import { ReviewSkeleton, type StageProgress } from "@/components/ReviewSkeleton";
import { MethodologyDrawer } from "@/components/MethodologyDrawer";
import { reviewMethodology } from "@/lib/review-methodology";
import { PROGRAM_OPTIONS } from "@/lib/rubrics";
import type { ReviewRequest, ReviewResponse } from "@/lib/review-types";

type View = "landing" | "report";

export default function Page() {
  const [view, setView] = useState<View>("landing");
  const [request, setRequest] = useState<ReviewRequest | null>(null);
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [previousReport, setPreviousReport] = useState<
    ReviewResponse["report"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [progress, setProgress] = useState<StageProgress[]>(initialProgress());

  async function handleSubmit(req: ReviewRequest) {
    setRequest(req);
    setError(null);
    setLoading(true);
    setView("report");
    setData(null);
    setProgress(initialProgress());
    try {
      const res = await fetch("/api/review-sop-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      let final: ReviewResponse | null = null;
      let streamErr: string | null = null;
      while (!done) {
        const { value, done: rdone } = await reader.read();
        done = rdone;
        if (value) buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let evt: unknown;
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (!evt || typeof evt !== "object") continue;
          const e = evt as Record<string, unknown>;
          if (e.type === "progress") {
            setProgress((cur) =>
              cur.map((s) =>
                s.id === e.stage
                  ? {
                      ...s,
                      status: e.phase === "end" ? "done" : "running",
                      ms: typeof e.ms === "number" ? e.ms : s.ms,
                    }
                  : s,
              ),
            );
          } else if (e.type === "done") {
            final = {
              report: e.report as ReviewResponse["report"],
              latencyMs: (e.latencyMs as number) ?? 0,
            };
          } else if (e.type === "error") {
            streamErr = (e.error as string) ?? "Pipeline failed";
          }
        }
      }
      if (streamErr) throw new Error(streamErr);
      if (!final) throw new Error("Stream ended without a result");
      setData(final);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setView("landing");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    setView("landing");
  }

  function handleRevise() {
    // User wants to submit a revised draft. Stash current report so the new
    // report can render against it as a delta.
    if (data?.report) setPreviousReport(data.report);
    setView("landing");
  }

  function handleNew() {
    setRequest(null);
    setData(null);
    setPreviousReport(null);
    setError(null);
    setView("landing");
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar
        onOpenMethodology={() => setMethodologyOpen(true)}
        onHome={view === "report" ? handleNew : null}
      />

      {view === "landing" ? (
        <Landing
          initial={request}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      ) : (
        <ReportView
          request={request}
          data={data}
          previousReport={previousReport}
          loading={loading}
          progress={progress}
          onEdit={handleEdit}
          onRevise={handleRevise}
          onNew={handleNew}
          onOpenMethodology={() => setMethodologyOpen(true)}
        />
      )}

      <MethodologyDrawer
        open={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
        items={reviewMethodology}
        title="How Leap Review works"
        eyebrow="Leap Review · Pipeline"
      />
    </div>
  );
}

function TopBar({
  onOpenMethodology,
  onHome,
}: {
  onOpenMethodology: () => void;
  onHome: (() => void) | null;
}) {
  return (
    <header className="app-header bg-white border-b border-rule no-print sticky top-0 z-30">
      <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between">
        <button
          onClick={onHome ?? undefined}
          disabled={!onHome}
          className="flex items-center gap-2.5 group disabled:cursor-default"
        >
          <div className="w-8 h-8 bg-purple rounded-lg flex items-center justify-center shadow-leap">
            <span className="font-display text-white font-bold text-[15px] leading-none">
              L
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <div className="font-display text-navy font-bold text-[17px] tracking-tighter2 group-hover:text-purple transition-colors">
              Leap Review
            </div>
            <div className="hidden sm:block text-ink-faint text-[10px] uppercase tracking-[0.12em] font-semibold border-l border-rule pl-2.5">
              Free SOP feedback · By Leap Scholar
            </div>
          </div>
        </button>
        <nav className="flex items-center gap-1">
          <button
            onClick={onOpenMethodology}
            className="text-[12px] font-semibold text-ink-muted hover:text-purple px-3 py-1.5 transition-colors"
          >
            How it works
          </button>
        </nav>
      </div>
    </header>
  );
}

// ── Landing view ───────────────────────────────────────────

function Landing({
  initial,
  onSubmit,
  loading,
  error,
}: {
  initial: ReviewRequest | null;
  onSubmit: (r: ReviewRequest) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <main className="max-w-[820px] mx-auto px-6 py-10 sm:py-12">
      <div className="text-center mb-9">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-purple font-semibold mb-4 bg-purple-tint border border-purple-pale rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 bg-purple rounded-full" />
          Free SOP feedback for Indian students applying abroad
        </div>
        <h1 className="font-display text-[34px] sm:text-[40px] font-bold text-navy tracking-tighter2 leading-[1.05]">
          Honest feedback on your SOP,<br />before you hit submit.
        </h1>
        <p className="text-[15px] sm:text-[16px] text-ink-muted mt-4 leading-relaxed max-w-[620px] mx-auto">
          Paste your Statement of Purpose. Leap Review scores it against the
          rubric for your target program, flags the clichés and weak claims
          Indian applicants tend to fall into, and tells you the three things
          to fix tonight. The kind of feedback a strong older sibling who&apos;s
          been through this would give you — direct, specific, no fluff.
        </p>
        <div className="flex items-center justify-center gap-4 mt-5 text-[10px] text-ink-faint uppercase tracking-[0.1em] font-semibold">
          <Stat label="programs" value={String(PROGRAM_OPTIONS.length)} />
          <Dot />
          <Stat label="dimensions scored" value="6" />
          <Dot />
          <Stat label="cost" value="free" />
        </div>
      </div>

      <div className="bg-white border border-rule rounded-xl shadow-card p-6 sm:p-8">
        <ReviewForm
          initial={initial}
          onSubmit={onSubmit}
          loading={loading}
        />
        {error && (
          <div className="mt-4 text-[12px] text-danger border border-danger/30 bg-danger/5 rounded-md px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-ink-faint mt-5 leading-relaxed">
        Your draft stays in your browser. Nothing is saved or shared.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-navy text-[14px] font-bold normal-case tracking-normal num">
        {value}
      </span>
      <span>{label}</span>
    </div>
  );
}

function Dot() {
  return <span className="w-1 h-1 bg-rule rounded-full" />;
}

// ── Report view ────────────────────────────────────────────

function initialProgress(): StageProgress[] {
  return [
    { id: "cliche-scan", label: "Scanning for clichés", status: "pending" },
    {
      id: "scoring",
      label: "Scoring against admitted baseline",
      status: "pending",
    },
    {
      id: "annotation",
      label: "Annotating issues in your draft",
      status: "pending",
    },
  ];
}

function ReportView({
  request,
  data,
  previousReport,
  loading,
  progress,
  onEdit,
  onRevise,
  onNew,
  onOpenMethodology,
}: {
  request: ReviewRequest | null;
  data: ReviewResponse | null;
  previousReport: ReviewResponse["report"] | null;
  loading: boolean;
  progress: StageProgress[];
  onEdit: () => void;
  onRevise: () => void;
  onNew: () => void;
  onOpenMethodology: () => void;
}) {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-6">
      {request && (
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap no-print">
          <RequestChip request={request} />
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              disabled={loading}
              className="text-[11px] uppercase tracking-[0.06em] font-semibold border border-rule rounded-md px-3 py-1.5 text-ink-muted hover:border-purple hover:text-purple disabled:opacity-50 transition-colors bg-white"
            >
              Edit draft
            </button>
            <button
              onClick={onRevise}
              disabled={loading}
              className="text-[11px] uppercase tracking-[0.06em] font-semibold border border-purple rounded-md px-3 py-1.5 text-purple hover:bg-purple hover:text-white disabled:opacity-50 transition-colors bg-white"
            >
              Submit revised draft
            </button>
            <button
              onClick={onNew}
              disabled={loading}
              className="text-[11px] uppercase tracking-[0.06em] font-semibold border border-rule rounded-md px-3 py-1.5 text-ink-muted hover:border-purple hover:text-purple disabled:opacity-50 transition-colors bg-white"
            >
              New review
            </button>
          </div>
        </div>
      )}

      {loading || !data ? (
        <ReviewSkeleton progress={progress} />
      ) : (
        <ReviewReport
          data={data}
          previousReport={previousReport}
          onOpenMethodology={onOpenMethodology}
        />
      )}
    </main>
  );
}

function RequestChip({ request }: { request: ReviewRequest }) {
  const programLabel =
    PROGRAM_OPTIONS.find((p) => p.id === request.programId)?.label ??
    request.programId;
  const wordCount = request.sopText.trim().split(/\s+/).length;
  const summary = [programLabel, `${wordCount} words`].join("  ·  ");

  return (
    <div className="bg-white border border-rule rounded-xl px-4 py-2.5 flex items-center gap-3 text-[12px] shadow-card flex-1 min-w-0">
      <div className="font-semibold text-navy whitespace-nowrap">
        {request.studentName || "SOP review"}
      </div>
      <div className="text-ink-faint">·</div>
      <div className="text-ink-muted truncate">{summary}</div>
    </div>
  );
}
