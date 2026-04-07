"use client";

import { useState } from "react";
import { IntakeForm } from "@/components/IntakeForm";
import { OutcomeBrief } from "@/components/OutcomeBrief";
import type { GenerateBriefResponse, Profile } from "@/lib/types";

export default function Page() {
  const [data, setData] = useState<GenerateBriefResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(profile: Profile) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const json: GenerateBriefResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <main className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="bg-white border border-rule p-5 h-fit lg:sticky lg:top-6">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint mb-3 pb-3 border-b border-rule">
            Student Profile
          </div>
          <IntakeForm onSubmit={handleSubmit} loading={loading} />
          {error && (
            <div className="mt-3 text-[11px] text-reach border border-reach px-2 py-1.5">
              {error}
            </div>
          )}
        </aside>

        <section>
          {data ? <OutcomeBrief data={data} /> : <EmptyState loading={loading} />}
        </section>
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="bg-white border-b border-rule">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <div className="text-navy font-semibold text-[15px] tracking-tightish">
            Leap Scholar
          </div>
          <div className="text-ink-faint text-[11px] uppercase tracking-[0.12em]">
            Outcome Intelligence
          </div>
        </div>
        <div className="text-[10px] text-ink-faint uppercase tracking-[0.1em]">
          v0.1 · Internal preview
        </div>
      </div>
    </header>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="bg-white border border-rule border-dashed h-[600px] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint mb-2">
          {loading ? "Analyzing profile" : "Awaiting profile"}
        </div>
        <div className="text-[14px] text-ink-muted leading-snug">
          {loading
            ? "Cross-referencing profile against the outcomes warehouse and adjusting base rates."
            : "Enter a student profile on the left, or load a demo profile from the buttons above the form. The brief will predict admit, visa, employment, and ROI outcomes for each recommended program."}
        </div>
      </div>
    </div>
  );
}
