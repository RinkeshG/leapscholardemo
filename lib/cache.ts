// Tiny in-memory brief cache. Process-local, fine for a prototype.
// Resets on cold start; that's intentional.

import type { OutcomeBrief } from "./brief-types";
import type { StudentProfile } from "./profile";

interface BriefEntry {
  brief: OutcomeBrief;
  storedAt: number;
}

const TTL_MS = 1000 * 60 * 60; // 1 hour
const briefStore = new Map<string, BriefEntry>();

export function profileKey(p: StudentProfile): string {
  return [
    p.cgpa,
    p.collegeTier,
    p.gre ?? "-",
    p.toefl ?? "-",
    p.workExperienceYears,
    p.workExperienceBucket,
    p.targetField,
    p.intent,
    p.budgetUSDCap,
    p.loanFunded ? 1 : 0,
    [...p.preferredCountries].sort().join(","),
  ].join("::");
}

export function getCachedBrief(p: StudentProfile): OutcomeBrief | null {
  const key = profileKey(p);
  const entry = briefStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > TTL_MS) {
    briefStore.delete(key);
    return null;
  }
  return entry.brief;
}

export function setCachedBrief(p: StudentProfile, brief: OutcomeBrief): void {
  const key = profileKey(p);
  briefStore.set(key, { brief, storedAt: Date.now() });
}
