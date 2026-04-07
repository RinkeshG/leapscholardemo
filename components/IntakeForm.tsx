"use client";

import { useState } from "react";
import type { Country, DegreeLevel, Field as FieldType, GpaScale, Profile } from "@/lib/types";
import { demoProfiles } from "@/lib/fixtures";

const COUNTRIES: Country[] = ["US", "UK", "Canada", "Australia", "Germany"];
const FIELDS: FieldType[] = [
  "Computer Science",
  "Data Science",
  "Business Analytics",
  "MBA",
  "Engineering",
];
const INTAKES = ["Fall 2026", "Spring 2027", "Fall 2027"];

const emptyProfile: Profile = {
  name: "",
  intake: "Fall 2026",
  countries: ["US"],
  field: "Computer Science",
  degree: "Masters",
  gpa: 8.5,
  gpaScale: "10",
  greGmat: undefined,
  ielts: 7.0,
  workExperienceYears: 1,
  budgetLakhs: 60,
};

interface Props {
  onSubmit: (profile: Profile) => void;
  loading: boolean;
}

export function IntakeForm({ onSubmit, loading }: Props) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function toggleCountry(c: Country) {
    setProfile((p) => ({
      ...p,
      countries: p.countries.includes(c)
        ? p.countries.filter((x) => x !== c)
        : [...p.countries, c],
    }));
  }

  function loadDemo(id: string) {
    const demo = demoProfiles.find((d) => d.id === id);
    if (demo) setProfile(demo.profile);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(profile);
      }}
      className="text-[13px] text-ink"
    >
      <div className="border-b border-rule pb-3 mb-4">
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-faint mb-2">
          Demo profiles
        </div>
        <div className="flex flex-wrap gap-1.5">
          {demoProfiles.map((d) => (
            <button
              type="button"
              key={d.id}
              onClick={() => loadDemo(d.id)}
              className="text-[11px] px-2 py-1 border border-rule hover:border-navy hover:text-navy transition-colors"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Student name">
        <input
          type="text"
          value={profile.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Aarav Mehta"
          className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Intake">
          <select
            value={profile.intake}
            onChange={(e) => update("intake", e.target.value)}
            className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy bg-white"
          >
            {INTAKES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Field>
        <Field label="Degree">
          <select
            value={profile.degree}
            onChange={(e) => update("degree", e.target.value as DegreeLevel)}
            className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy bg-white"
          >
            <option>Masters</option>
            <option>Bachelors</option>
          </select>
        </Field>
      </div>

      <Field label="Field of study">
        <select
          value={profile.field}
          onChange={(e) => update("field", e.target.value as FieldType)}
          className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy bg-white"
        >
          {FIELDS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </Field>

      <Field label="Target countries">
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map((c) => {
            const on = profile.countries.includes(c);
            return (
              <button
                type="button"
                key={c}
                onClick={() => toggleCountry(c)}
                className={`text-[11px] px-2 py-1 border transition-colors ${
                  on
                    ? "bg-navy text-white border-navy"
                    : "border-rule hover:border-navy"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="GPA">
          <input
            type="number"
            step="0.01"
            value={profile.gpa}
            onChange={(e) => update("gpa", parseFloat(e.target.value))}
            className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy num"
          />
        </Field>
        <Field label="Scale">
          <select
            value={profile.gpaScale}
            onChange={(e) => update("gpaScale", e.target.value as GpaScale)}
            className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy bg-white"
          >
            <option value="10">/ 10</option>
            <option value="4">/ 4</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="GRE / GMAT">
          <input
            type="number"
            value={profile.greGmat ?? ""}
            placeholder="optional"
            onChange={(e) =>
              update(
                "greGmat",
                e.target.value === "" ? undefined : parseInt(e.target.value, 10),
              )
            }
            className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy num"
          />
        </Field>
        <Field label="IELTS">
          <input
            type="number"
            step="0.5"
            value={profile.ielts}
            onChange={(e) => update("ielts", parseFloat(e.target.value))}
            className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy num"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Work ex (yrs)">
          <input
            type="number"
            value={profile.workExperienceYears}
            onChange={(e) =>
              update("workExperienceYears", parseInt(e.target.value, 10) || 0)
            }
            className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy num"
          />
        </Field>
        <Field label="Budget (₹L)">
          <input
            type="number"
            value={profile.budgetLakhs}
            onChange={(e) =>
              update("budgetLakhs", parseInt(e.target.value, 10) || 0)
            }
            className="w-full border border-rule px-2 py-1.5 focus:outline-none focus:border-navy num"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-navy text-white text-[12px] uppercase tracking-[0.1em] py-2.5 hover:bg-navy-900 disabled:bg-ink-faint transition-colors"
      >
        {loading ? "Generating brief…" : "Generate Outcome Brief"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <div className="text-[10px] uppercase tracking-[0.08em] text-ink-faint mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}
