// Streaming variant of /api/review-sop.
//
// Emits NDJSON lines as the pipeline progresses, so the UI can show real
// stage-by-stage progress instead of a vibes-based skeleton timer.
//
// Line shapes:
//   { "type": "progress", "stage": "...", "phase": "start"|"end", "ms"?: number }
//   { "type": "done", "report": ReviewReport, "latencyMs": number }
//   { "type": "error", "error": string }

import {
  runReviewPipeline,
  MissingApiKeyError,
  type PipelineProgressEvent,
} from "@/lib/review-pipeline";
import { rubrics } from "@/lib/rubrics";
import { getCachedReview, setCachedReview } from "@/lib/cache";
import type { ProgramId } from "@/lib/review-types";

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
  if (typeof v.sopText !== "string" || v.sopText.trim().length < 100) return null;
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
  let parsed: ParsedRequest;
  try {
    const body = await request.json();
    const p = parseRequest(body);
    if (!p) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }) + "\n",
        { status: 400, headers: { "Content-Type": "application/x-ndjson" } },
      );
    }
    parsed = p;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }) + "\n", {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  const startedAt = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        const cached = getCachedReview(parsed.sopText, parsed.programId);
        if (cached) {
          // Replay all 3 stages instantly so the UI animation still feels real.
          for (const stage of ["cliche-scan", "scoring", "annotation"] as const) {
            send({ type: "progress", stage, phase: "start" });
            send({ type: "progress", stage, phase: "end", ms: 0 });
          }
          send({
            type: "done",
            report: cached,
            latencyMs: Date.now() - startedAt,
          });
          controller.close();
          return;
        }

        const result = await runReviewPipeline(parsed.sopText, parsed.programId, {
          studentName: parsed.studentName,
          onProgress: (e: PipelineProgressEvent) => {
            send({
              type: "progress",
              stage: e.stage,
              phase: e.type === "stage-start" ? "start" : "end",
              ms: e.ms,
            });
          },
        });

        setCachedReview(parsed.sopText, parsed.programId, result.report);
        send({
          type: "done",
          report: result.report,
          latencyMs: Date.now() - startedAt,
        });
        controller.close();
      } catch (err) {
        const message =
          err instanceof MissingApiKeyError
            ? err.message
            : err instanceof Error
              ? `Review pipeline failed: ${err.message}`
              : "Review pipeline failed for an unknown reason.";
        send({ type: "error", error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
