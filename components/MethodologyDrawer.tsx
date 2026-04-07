"use client";

import { useEffect } from "react";

export interface MethodologyItem {
  heading: string;
  body: string;
}

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
  title = "How this works",
  eyebrow = "Leap Review",
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 no-print">
      <div
        className="absolute inset-0 scrim animate-fadeIn"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Methodology"
        className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-leap animate-slideIn flex flex-col"
      >
        <header className="px-6 py-5 border-b border-rule flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-purple font-semibold mb-1">
              {eyebrow}
            </div>
            <h2 className="font-display text-[22px] font-bold text-navy tracking-tighter2">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-ink-faint hover:text-navy transition-colors text-[20px] leading-none -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {items.map((m) => (
            <section key={m.heading}>
              <h3 className="font-display text-[13px] font-bold text-navy uppercase tracking-[0.06em] mb-1.5">
                {m.heading}
              </h3>
              <p className="text-[13px] text-ink-muted leading-relaxed">
                {m.body}
              </p>
            </section>
          ))}
        </div>

        <footer className="px-6 py-4 border-t border-rule bg-surface text-[11px] text-ink-faint leading-relaxed">
          Last updated <span className="num text-ink">April 2026</span>.
          Reflects post-2024 visa data and the most recent two intake cycles.
        </footer>
      </aside>
    </div>
  );
}
