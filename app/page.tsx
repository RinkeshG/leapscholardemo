"use client";

import { useState } from "react";
import { IntakeForm } from "@/components/IntakeForm";
import { OutcomeBrief } from "@/components/OutcomeBrief";
import { BriefSkeleton } from "@/components/BriefSkeleton";
import { MethodologyDrawer } from "@/components/MethodologyDrawer";
import { briefMethodology } from "@/lib/methodology";
import type { StudentProfile } from "@/lib/profile";
import type { BriefResponse } from "@/lib/brief-types";

type View = "landing" | "brief";

export default function Page() {
  const [view, setView] = useState<View>("landing");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [data, setData] = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  async function handleSubmit(p: StudentProfile) {
    setProfile(p);
    setError(null);
    setLoading(true);
    setView("brief");
    setData(null);
    try {
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const json: BriefResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setView("landing");
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setData(null);
    setError(null);
    setView("landing");
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar
        onOpenMethodology={() => setMethodologyOpen(true)}
        onHome={view === "brief" ? handleNew : null}
      />

      {view === "landing" ? (
        <Landing
          initial={profile}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      ) : (
        <BriefView
          profile={profile}
          data={data}
          loading={loading}
          onNew={handleNew}
          onOpenMethodology={() => setMethodologyOpen(true)}
        />
      )}

      <MethodologyDrawer
        open={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
        items={briefMethodology}
        title="How Leap Intelligence works"
        eyebrow="Methodology"
      />
    </div>
  );
}

// ── Top bar ────────────────────────────────────────────────

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
              Leap Intelligence
            </div>
            <div className="hidden sm:block eyebrow border-l border-rule pl-3">
              Outcome Brief · by Leap Scholar
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

// ── Landing ────────────────────────────────────────────────

function Landing({
  initial,
  onSubmit,
  loading,
  error,
}: {
  initial: StudentProfile | null;
  onSubmit: (p: StudentProfile) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <main className="max-w-[820px] mx-auto px-6 py-12 sm:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 eyebrow !text-purple mb-5 bg-purple-wash ring-1 ring-purple-pale rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 bg-purple rounded-full" />
          For Indian undergrads thinking about studying abroad
        </div>
        <h1 className="font-display text-[36px] sm:text-display font-bold text-navy tracking-tighter2 leading-[1.05]">
          Will you actually get in,
          <br />
          <span className="text-purple">and is it worth it?</span>
        </h1>
        <p className="text-lede text-ink-muted mt-5 max-w-[600px] mx-auto">
          Tell us about yourself. We&apos;ll match your profile against the
          last three years of Indian outcomes and build you an honest one-page
          brief — admit odds, visa odds, ROI, and the picks a biased counselor
          won&apos;t mention.
        </p>
        <div className="flex items-center justify-center gap-5 mt-6">
          <Stat label="Programs scored" value="30" />
          <Dot />
          <Stat label="Countries" value="6" />
          <Dot />
          <Stat label="Cost" value="Free" />
        </div>
      </div>

      <div className="bg-white ring-1 ring-rule-soft rounded-2xl shadow-cardRaised p-7 sm:p-9">
        <IntakeForm initial={initial} onSubmit={onSubmit} loading={loading} />
        {error && (
          <div className="mt-4 text-caption text-danger border border-danger/30 bg-danger-tint/60 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}
      </div>

      <p className="text-center text-caption text-ink-subtle mt-6 leading-relaxed">
        No accounts. No saved data. No partner-university bias.
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

// ── Brief view ─────────────────────────────────────────────

function BriefView({
  profile,
  data,
  loading,
  onNew,
  onOpenMethodology,
}: {
  profile: StudentProfile | null;
  data: BriefResponse | null;
  loading: boolean;
  onNew: () => void;
  onOpenMethodology: () => void;
}) {
  return (
    <main className="max-w-[1100px] mx-auto px-6 py-8">
      {profile && (
        <div className="mb-5 flex items-center justify-between gap-4 flex-wrap no-print">
          <ProfileChip profile={profile} />
          <div className="flex items-center gap-2">
            <ChromeButton onClick={onNew} disabled={loading}>
              Start a new brief
            </ChromeButton>
          </div>
        </div>
      )}

      {loading || !data ? (
        <BriefSkeleton />
      ) : (
        <OutcomeBrief
          brief={data.brief}
          onOpenMethodology={onOpenMethodology}
        />
      )}
    </main>
  );
}

function ProfileChip({ profile }: { profile: StudentProfile }) {
  const who = profile.studentName || "Your brief";
  return (
    <div className="bg-white ring-1 ring-rule-soft rounded-xl px-4 py-2.5 flex items-center gap-3 text-caption shadow-card flex-1 min-w-0">
      <div className="font-semibold text-navy whitespace-nowrap">{who}</div>
      <span className="w-1 h-1 rounded-full bg-rule-strong" aria-hidden />
      <div className="text-ink-muted truncate">
        <span className="num">{profile.cgpa.toFixed(1)}</span> CGPA
        <span className="text-ink-faint mx-1.5">·</span>
        {profile.preferredCountries.join(" / ")}
      </div>
    </div>
  );
}

function ChromeButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-caption font-semibold rounded-lg px-3.5 py-2 ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white text-ink-muted ring-rule hover:text-purple hover:ring-purple-pale"
    >
      {children}
    </button>
  );
}
