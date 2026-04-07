"use client";

import { useState } from "react";
import { PROGRAM_OPTIONS } from "@/lib/rubrics";
import { sampleSops } from "@/lib/sample-sops";
import type { ProgramId, ReviewRequest } from "@/lib/review-types";

interface Props {
  initial?: ReviewRequest | null;
  onSubmit: (req: ReviewRequest) => void;
  loading: boolean;
}

export function ReviewForm({ initial, onSubmit, loading }: Props) {
  const [studentName, setStudentName] = useState(initial?.studentName ?? "");
  const [programId, setProgramId] = useState<ProgramId>(
    initial?.programId ?? "cmu-mscs",
  );
  const [sopText, setSopText] = useState(initial?.sopText ?? "");

  const wordCount = sopText.trim() ? sopText.trim().split(/\s+/).length : 0;
  const canSubmit = wordCount >= 80 && !loading;

  function loadSample(id: string) {
    const s = sampleSops.find((x) => x.id === id);
    if (!s) return;
    setProgramId(s.programId);
    setSopText(s.text);
    onSubmit({ sopText: s.text, programId: s.programId, studentName });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ sopText, programId, studentName });
      }}
      className="text-[13px] text-ink"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Student name" hint="Optional, for the handoff message">
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. Aarav Mehta"
            className="w-full border border-rule rounded-md px-3 py-2 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/10 transition-shadow"
          />
        </Field>

        <Field label="Target program">
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value as ProgramId)}
            className="w-full border border-rule rounded-md px-3 py-2 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/10 bg-white appearance-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%235A6473' d='M6 8 0 0h12z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "10px",
              paddingRight: "32px",
            }}
          >
            {PROGRAM_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Statement of Purpose"
        hint={`${wordCount} words${wordCount > 0 && wordCount < 80 ? " — need at least 80" : ""}`}
      >
        <textarea
          value={sopText}
          onChange={(e) => setSopText(e.target.value)}
          placeholder="Paste the SOP draft here. The reviewer works best on full drafts (500-1000 words)."
          rows={14}
          className="w-full border border-rule rounded-md px-3 py-2.5 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/10 font-sans text-[13px] leading-relaxed resize-y"
        />
      </Field>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full mt-2 bg-purple text-white text-[14px] font-semibold py-3 rounded-md hover:bg-navy disabled:bg-purple/50 disabled:cursor-not-allowed transition-colors shadow-leap"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Running review pipeline…
          </span>
        ) : (
          "Review this SOP"
        )}
      </button>

      <div className="border-t border-rule mt-6 pt-5">
        <div className="text-[11px] text-ink-muted text-center mb-2.5">
          No draft handy? Try a sample
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {sampleSops.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => loadSample(s.id)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 border border-rule rounded-md text-ink-muted hover:border-purple hover:text-purple disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3.5">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[11px] uppercase tracking-[0.06em] text-navy font-semibold">
          {label}
        </div>
        {hint && (
          <div className="text-[10px] text-ink-faint normal-case tracking-normal num">
            {hint}
          </div>
        )}
      </div>
      {children}
    </label>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"
      aria-hidden
    />
  );
}
