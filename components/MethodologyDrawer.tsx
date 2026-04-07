"use client";

import { useEffect } from "react";
import type { MethodologyItem } from "@/lib/methodology";

interface Props {
  open: boolean;
  onClose: () => void;
  items: MethodologyItem[];
  title?: string;
  eyebrow?: string;
}

export function MethodologyDrawer({
  open,
  onClose,
  items,
  title = "How Leap Intelligence works",
  eyebrow = "Methodology",
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 no-print">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 scrim animate-fadeIn"
      />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-cardRaised overflow-y-auto animate-slideIn">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-rule-soft px-7 py-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="eyebrow text-purple mb-1.5">{eyebrow}</div>
            <h2 className="font-display text-h3 text-navy font-bold tracking-tightish">
              {title}
            </h2>
            <div className="text-caption text-ink-muted mt-1">
              The math, the data, and what we're choosing not to do.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close methodology"
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-purple-wash hover:text-purple transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M2 2l10 10M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="px-7 py-6 space-y-7">
          {items.map((item, i) => (
            <section key={item.id}>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="num font-display font-bold text-purple text-[12px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-[15px] text-navy font-bold tracking-tightish">
                  {item.title}
                </h3>
              </div>
              <p className="text-body text-ink-muted leading-relaxed pl-7">
                {item.body}
              </p>
            </section>
          ))}
        </div>

        <div className="px-7 py-6 border-t border-rule-soft text-caption text-ink-subtle leading-relaxed">
          Built by an applicant for the Leap Scholar PM team. The dataset and
          scoring code is hand-curated for this prototype; in production, both
          would query Leap's outcome warehouse directly.
        </div>
      </aside>
    </div>
  );
}
