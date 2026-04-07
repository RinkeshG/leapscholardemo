// Tiny in-memory review cache. Process-local, fine for a prototype.
// Resets on cold start; that's intentional.

import type { ProgramId, ReviewReport } from "./review-types";

interface ReviewEntry {
  report: ReviewReport;
  storedAt: number;
}

const TTL_MS = 1000 * 60 * 60; // 1 hour
const reviewStore = new Map<string, ReviewEntry>();

function reviewKey(sopText: string, programId: ProgramId): string {
  // Hash-ish: program + length + first/last 64 chars. Cheap and good enough
  // to avoid collisions in a prototype while keeping keys small.
  const trimmed = sopText.trim();
  const head = trimmed.slice(0, 64);
  const tail = trimmed.slice(-64);
  return `${programId}::${trimmed.length}::${head}::${tail}`;
}

export function getCachedReview(
  sopText: string,
  programId: ProgramId,
): ReviewReport | null {
  const key = reviewKey(sopText, programId);
  const entry = reviewStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > TTL_MS) {
    reviewStore.delete(key);
    return null;
  }
  return entry.report;
}

export function setCachedReview(
  sopText: string,
  programId: ProgramId,
  report: ReviewReport,
): void {
  const key = reviewKey(sopText, programId);
  reviewStore.set(key, { report, storedAt: Date.now() });
}
