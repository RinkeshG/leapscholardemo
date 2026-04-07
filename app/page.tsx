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
    <header className="app-header bg-white/85 backdrop-blur-md border-b border-rule-soft no-print sticky top-0 z-30">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
        <button
          onClick={onHome ?? undefined}
          disabled={!onHome}
          className="flex items-center gap-3 group disabled:cursor-default"
        >
          <div className="w-9 h-9 bg-purple rounded-xl flex items-center justify-center shadow-leap">
            <span className="font-display text-white font-bold text-[16px] leading-none">
              L
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="font-display text-navy font-bold text-[18px] tracking-tighter2 group-hover:text-purple transition-colors">
              Leap Review
            </div>
            <div className="hidden sm:block eyebrow border-l border-rule pl-3">
              Free SOP feedback by Leap Scholar
            </div>
          </div>
        </button>
        <nav className="flex items-center gap-1">
          <button
            onClick={onOpenMethodology}
            className="text-caption font-semibold text-ink-muted hover:text-purple hover:bg-purple-wash px-3 py-2 rounded-lg transition-colors"
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
    <main className="max-w-[820px] mx-auto px-6 py-12 sm:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 eyebrow !text-purple mb-5 bg-purple-wash ring-1 ring-purple-pale rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 bg-purple rounded-full" />
          For Indian students applying abroad
        </div>
        <h1 className="font-display text-[36px] sm:text-display font-bold text-navy tracking-tighter2 leading-[1.05]">
          Honest feedback on your SOP,
          <br />
          <span className="text-purple">before you hit submit.</span>
        </h1>
        <p className="text-lede text-ink-muted mt-5 max-w-[600px] mx-auto">
          Paste your draft. We score it against admitted Indian applicants to
          your target program, flag the clichés and weak claims, and tell you
          the three things to fix next — like a strong older sibling who&apos;s
          been through this would.
        </p>
        <div className="flex items-center justify-center gap-5 mt-6">
          <Stat label="Programs" value={String(PROGRAM_OPTIONS.length)} />
          <Dot />
          <Stat label="Dimensions scored" value="6" />
          <Dot />
          <Stat label="Cost" value="Free" />
        </div>
      </div>

      <div className="bg-white ring-1 ring-rule-soft rounded-2xl shadow-cardRaised p-7 sm:p-9">
        <ReviewForm
          initial={initial}
          onSubmit={onSubmit}
          loading={loading}
        />
        {error && (
          <div className="mt-4 text-caption text-danger border border-danger/30 bg-danger-tint/60 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}
      </div>

      <p className="text-center text-caption text-ink-subtle mt-6 leading-relaxed">
        Your draft stays in your browser. Nothing is saved or shared.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-navy text-h4 font-bold num">
        {value}
      </span>
      <span className="text-caption text-ink-subtle">{label}</span>
    </div>
  );
}

function Dot() {
  return <span className="w-1 h-1 bg-rule-strong rounded-full" />;
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
    <main className="max-w-[1200px] mx-auto px-6 py-8">
      {request && (
        <div className="mb-5 flex items-center justify-between gap-4 flex-wrap no-print">
          <RequestChip request={request} />
          <div className="flex items-center gap-2">
            <ChromeButton onClick={onEdit} disabled={loading}>
              Edit draft
            </ChromeButton>
            <ChromeButton
              onClick={onRevise}
              disabled={loading}
              variant="primary"
            >
              Submit revised draft
            </ChromeButton>
            <ChromeButton onClick={onNew} disabled={loading}>
              New review
            </ChromeButton>
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

  return (
    <div className="bg-white ring-1 ring-rule-soft rounded-xl px-4 py-2.5 flex items-center gap-3 text-caption shadow-card flex-1 min-w-0">
      <div className="font-semibold text-navy whitespace-nowrap">
        {request.studentName || "SOP review"}
      </div>
      <span className="w-1 h-1 rounded-full bg-rule-strong" aria-hidden />
      <div className="text-ink-muted truncate">
        {programLabel}
        <span className="text-ink-faint mx-1.5">·</span>
        <span className="num">{wordCount}</span> words
      </div>
    </div>
  );
}

function ChromeButton({
  onClick,
  disabled,
  children,
  variant = "default",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "default" | "primary";
}) {
  const cls =
    variant === "primary"
      ? "bg-purple text-white ring-purple hover:bg-navy hover:ring-navy"
      : "bg-white text-ink-muted ring-rule hover:text-purple hover:ring-purple-pale";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-caption font-semibold rounded-lg px-3.5 py-2 ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}
