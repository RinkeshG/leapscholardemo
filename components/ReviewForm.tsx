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
      className="text-body text-ink-strong"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your name" hint="Optional">
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Aarav Mehta"
            className="w-full bg-white ring-1 ring-rule rounded-lg px-3.5 py-2.5 text-body placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-purple transition-shadow"
          />
        </Field>

        <Field label="Target program">
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value as ProgramId)}
            className="w-full bg-white ring-1 ring-rule rounded-lg px-3.5 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-purple appearance-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%235A6473' d='M6 8 0 0h12z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              backgroundSize: "10px",
              paddingRight: "36px",
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
        label="Your Statement of Purpose"
        hint={
          <span className="num">
            {wordCount} words
            {wordCount > 0 && wordCount < 80 && (
              <span className="text-warn"> · need 80+</span>
            )}
          </span>
        }
      >
        <textarea
          value={sopText}
          onChange={(e) => setSopText(e.target.value)}
          placeholder="Paste your full draft here. The reviewer works best on 500–1000 word drafts."
          rows={14}
          className="w-full bg-white ring-1 ring-rule rounded-lg px-4 py-3 font-sans text-body leading-[1.7] text-ink-strong placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-purple resize-y transition-shadow"
        />
      </Field>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full mt-3 bg-purple text-white text-[15px] font-semibold py-3.5 rounded-lg hover:bg-navy disabled:bg-purple/40 disabled:cursor-not-allowed transition-colors shadow-leap"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Reviewing your draft…
          </span>
        ) : (
          "Review my SOP"
        )}
      </button>

      <div className="border-t border-rule-soft mt-7 pt-5">
        <div className="text-caption text-ink-subtle text-center mb-3">
          No draft handy? Try a sample
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {sampleSops.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => loadSample(s.id)}
              disabled={loading}
              className="text-caption px-3 py-1.5 ring-1 ring-rule rounded-full text-ink-muted hover:text-purple hover:ring-purple-pale hover:bg-purple-wash disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-4 last-of-type:mb-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-caption text-navy font-semibold">{label}</div>
        {hint && <div className="text-micro text-ink-faint">{hint}</div>}
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
