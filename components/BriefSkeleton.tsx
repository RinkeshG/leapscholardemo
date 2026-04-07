export function BriefSkeleton() {
  return (
    <article className="bg-white rounded-2xl shadow-cardRaised overflow-hidden ring-1 ring-rule-soft animate-fadeIn">
      {/* Header */}
      <div className="px-7 pt-7 pb-6 sm:px-9 sm:pt-9 sm:pb-7">
        <SkelLine className="h-3 w-40 mb-3" />
        <SkelLine className="h-8 w-[60%] mb-2" />
        <SkelLine className="h-3 w-48" />
      </div>

      {/* Verdict */}
      <div className="px-7 sm:px-9 pb-8">
        <div className="bg-purple-wash rounded-2xl px-8 py-7">
          <SkelLine className="h-3 w-28 mb-3" />
          <SkelLine className="h-6 w-[85%] mb-2" />
          <SkelLine className="h-6 w-[70%]" />
        </div>
      </div>

      {/* Bet sheet */}
      <div className="px-7 sm:px-9 py-7 border-t border-rule-soft">
        <SkelLine className="h-5 w-64 mb-5" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="py-4 border-t border-rule-soft first:border-t-0 flex items-center gap-4"
          >
            <SkelLine className="h-4 w-[30%]" />
            <div className="flex-1" />
            <SkelLine className="h-3 w-10" />
            <SkelLine className="h-3 w-10" />
            <SkelLine className="h-3 w-14" />
            <SkelLine className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Scanning line */}
      <div className="px-7 sm:px-9 py-5 border-t border-rule-soft text-caption text-ink-subtle text-center">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-purple border-t-transparent rounded-full animate-spin" />
          Matching your profile to comparable Leap students…
        </span>
      </div>
    </article>
  );
}

function SkelLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-rule-soft rounded ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s linear infinite",
      }}
    />
  );
}
