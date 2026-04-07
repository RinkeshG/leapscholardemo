"use client";

import { useState } from "react";
import type {
  CollegeTier,
  Intent,
  StudentProfile,
  WorkExperienceBucket,
} from "@/lib/profile";
import type { Country, ProgramField } from "@/lib/universities";

interface Props {
  initial?: StudentProfile | null;
  onSubmit: (profile: StudentProfile) => void;
  loading: boolean;
}

const TIER_OPTIONS: { value: CollegeTier; label: string }[] = [
  { value: "iit", label: "IIT" },
  { value: "nit-tier1", label: "NIT / top govt" },
  { value: "tier1-private", label: "BITS / IIIT-H / top private" },
  { value: "tier2", label: "Tier-2 engineering" },
  { value: "tier3", label: "Tier-3 engineering" },
];

const WORK_OPTIONS: { value: WorkExperienceBucket; label: string }[] = [
  { value: "none", label: "No work experience" },
  { value: "service-company", label: "Service company (TCS/Infy/Wipro)" },
  { value: "indian-startup", label: "Indian startup / product co." },
  { value: "faang-or-similar", label: "FAANG / top MNC tech" },
  { value: "research-or-phd", label: "Research / publications" },
];

const FIELD_OPTIONS: { value: ProgramField; label: string }[] = [
  { value: "cs", label: "Computer Science" },
  { value: "ai-ml", label: "AI / Machine Learning" },
  { value: "data-science", label: "Data Science" },
  { value: "business-analytics", label: "Business Analytics" },
];

const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: "industry-stay-abroad", label: "Get a job and stay abroad" },
  { value: "industry-return", label: "Get the credential, come back to India" },
  { value: "research", label: "Research / PhD track" },
  { value: "undecided", label: "Still figuring it out" },
];

const COUNTRY_OPTIONS: { value: Country; label: string }[] = [
  { value: "US", label: "US" },
  { value: "UK", label: "UK" },
  { value: "Canada", label: "Canada" },
  { value: "Germany", label: "Germany" },
  { value: "Ireland", label: "Ireland" },
  { value: "Australia", label: "Australia" },
];

export function IntakeForm({ initial, onSubmit, loading }: Props) {
  const [studentName, setStudentName] = useState(initial?.studentName ?? "");
  const [cgpa, setCgpa] = useState<string>(
    initial ? initial.cgpa.toFixed(1) : "",
  );
  const [collegeTier, setCollegeTier] = useState<CollegeTier>(
    initial?.collegeTier ?? "tier2",
  );
  const [gre, setGre] = useState<string>(
    initial?.gre != null ? String(initial.gre) : "",
  );
  const [workYears, setWorkYears] = useState<string>(
    initial ? String(initial.workExperienceYears) : "0",
  );
  const [workBucket, setWorkBucket] = useState<WorkExperienceBucket>(
    initial?.workExperienceBucket ?? "none",
  );
  const [targetField, setTargetField] = useState<ProgramField>(
    initial?.targetField ?? "cs",
  );
  const [intent, setIntent] = useState<Intent>(
    initial?.intent ?? "industry-stay-abroad",
  );
  const [budgetLakhs, setBudgetLakhs] = useState<string>(
    initial ? String(Math.round((initial.budgetUSDCap * 83) / 100000)) : "60",
  );
  const [loanFunded, setLoanFunded] = useState<boolean>(
    initial?.loanFunded ?? true,
  );
  const [countries, setCountries] = useState<Country[]>(
    initial?.preferredCountries ?? ["US"],
  );

  const cgpaNum = Number(cgpa);
  const cgpaOk = cgpaNum >= 4 && cgpaNum <= 10;
  const canSubmit =
    cgpaOk &&
    countries.length > 0 &&
    Number(budgetLakhs) >= 10 &&
    !loading;

  function toggleCountry(c: Country) {
    setCountries((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const budgetUSDCap = Math.round(
      (Number(budgetLakhs) * 100000) / 83, // ₹ lakhs → USD at ~83
    );
    onSubmit({
      studentName: studentName.trim() || undefined,
      cgpa: cgpaNum,
      collegeTier,
      gre: gre ? Number(gre) : null,
      toefl: null,
      workExperienceYears: Number(workYears),
      workExperienceBucket: workBucket,
      targetField,
      intent,
      budgetUSDCap,
      loanFunded,
      preferredCountries: countries,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="text-body text-ink-strong">
      {/* Row 1 — name + tier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your name" hint="Optional">
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Aarav Mehta"
            className={inputCls}
          />
        </Field>

        <Field label="Your college">
          <select
            value={collegeTier}
            onChange={(e) => setCollegeTier(e.target.value as CollegeTier)}
            className={selectCls}
            style={selectStyle}
          >
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Row 2 — CGPA + GRE */}
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="CGPA"
          hint="on a 10 scale"
        >
          <input
            type="number"
            step="0.1"
            min="4"
            max="10"
            value={cgpa}
            onChange={(e) => setCgpa(e.target.value)}
            placeholder="7.4"
            className={inputCls}
          />
        </Field>

        <Field label="GRE" hint="leave blank if not taken">
          <input
            type="number"
            min="260"
            max="340"
            value={gre}
            onChange={(e) => setGre(e.target.value)}
            placeholder="320"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Row 3 — work years + work type */}
      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4">
        <Field label="Work exp." hint="years">
          <input
            type="number"
            step="0.5"
            min="0"
            max="20"
            value={workYears}
            onChange={(e) => setWorkYears(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Where?">
          <select
            value={workBucket}
            onChange={(e) =>
              setWorkBucket(e.target.value as WorkExperienceBucket)
            }
            className={selectCls}
            style={selectStyle}
          >
            {WORK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Row 4 — target field + intent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Target field">
          <select
            value={targetField}
            onChange={(e) => setTargetField(e.target.value as ProgramField)}
            className={selectCls}
            style={selectStyle}
          >
            {FIELD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="What do you actually want from this?">
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as Intent)}
            className={selectCls}
            style={selectStyle}
          >
            {INTENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Row 5 — budget + loan */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
        <Field label="Budget ceiling" hint="₹ lakhs, total">
          <input
            type="number"
            min="10"
            max="300"
            step="5"
            value={budgetLakhs}
            onChange={(e) => setBudgetLakhs(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Is this loan-funded?">
          <div className="flex gap-2">
            <ToggleButton
              active={loanFunded}
              onClick={() => setLoanFunded(true)}
            >
              Yes, taking a loan
            </ToggleButton>
            <ToggleButton
              active={!loanFunded}
              onClick={() => setLoanFunded(false)}
            >
              Self-funded
            </ToggleButton>
          </div>
        </Field>
      </div>

      {/* Row 6 — countries */}
      <Field
        label="Countries you'd consider"
        hint="pick all that apply"
      >
        <div className="flex flex-wrap gap-2">
          {COUNTRY_OPTIONS.map((c) => {
            const on = countries.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCountry(c.value)}
                className={`text-caption font-semibold px-3.5 py-2 rounded-full ring-1 transition-colors ${
                  on
                    ? "bg-purple text-white ring-purple"
                    : "bg-white text-ink-muted ring-rule hover:ring-purple-pale hover:bg-purple-wash hover:text-purple"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </Field>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full mt-3 bg-purple text-white text-[15px] font-semibold py-3.5 rounded-lg hover:bg-navy disabled:bg-purple/40 disabled:cursor-not-allowed transition-colors shadow-leap"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            Running the numbers…
          </span>
        ) : (
          "Generate my Outcome Brief"
        )}
      </button>

      <p className="text-center text-caption text-ink-subtle mt-4 leading-relaxed">
        No accounts. No saved data. No partner-university bias.
      </p>
    </form>
  );
}

const inputCls =
  "w-full bg-white ring-1 ring-rule rounded-lg px-3.5 py-2.5 text-body placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-purple transition-shadow";

const selectCls =
  "w-full bg-white ring-1 ring-rule rounded-lg px-3.5 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-purple appearance-none";

const selectStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%235A6473' d='M6 8 0 0h12z'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 14px center",
  backgroundSize: "10px",
  paddingRight: "36px",
};

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

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-caption font-semibold px-3.5 py-2.5 rounded-lg ring-1 transition-colors ${
        active
          ? "bg-purple-wash text-purple ring-purple-pale"
          : "bg-white text-ink-muted ring-rule hover:ring-purple-pale"
      }`}
    >
      {children}
    </button>
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
