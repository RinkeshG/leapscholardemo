// Leap Review pipeline endpoint.
//
// Thin wrapper around lib/review-pipeline.ts. Validates the request, checks
// the cache, runs the real pipeline, returns the result. No fixtures, no
// fallbacks — if the pipeline fails the client gets an error, not fake data.

import { NextResponse } from "next/server";
import { runReviewPipeline, MissingApiKeyError } from "@/lib/review-pipeline";
import { rubrics } from "@/lib/rubrics";
import { getCachedReview, setCachedReview } from "@/lib/cache";
import type { ProgramId, ReviewResponse } from "@/lib/review-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_PROGRAM_IDS = new Set<ProgramId>(
  Object.keys(rubrics) as ProgramId[],
);

interface ParsedRequest {
  sopText: string;
  programId: ProgramId;
  studentName: string | null;
}

function parseRequest(body: unknown): ParsedRequest | null {
  if (!body || typeof body !== "object") return null;
  const v = body as Record<string, unknown>;
  if (typeof v.sopText !== "string" || v.sopText.trim().length < 100)
    return null;
  if (typeof v.programId !== "string") return null;
  if (!VALID_PROGRAM_IDS.has(v.programId as ProgramId)) return null;
  return {
    sopText: v.sopText.trim(),
    programId: v.programId as ProgramId,
    studentName:
      typeof v.studentName === "string" && v.studentName.trim().length > 0
        ? v.studentName.trim()
        : null,
  };
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  let parsed: ParsedRequest;
  try {
    const body = await request.json();
    const p = parseRequest(body);
    if (!p) {
      return NextResponse.json(
        { error: "Invalid request: need sopText (≥100 chars) and programId" },
        { status: 400 },
      );
    }
    parsed = p;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cached = getCachedReview(parsed.sopText, parsed.programId);
  if (cached) {
    const payload: ReviewResponse = {
      report: cached,
      latencyMs: Date.now() - startedAt,
    };
    return NextResponse.json(payload);
  }

  try {
    const result = await runReviewPipeline(parsed.sopText, parsed.programId, {
      studentName: parsed.studentName,
    });
    setCachedReview(parsed.sopText, parsed.programId, result.report);
    const payload: ReviewResponse = {
      report: result.report,
      latencyMs: Date.now() - startedAt,
    };
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[review-sop] pipeline failed:", err);
    const message =
      err instanceof Error
        ? `Review pipeline failed: ${err.message}`
        : "Review pipeline failed for an unknown reason.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
