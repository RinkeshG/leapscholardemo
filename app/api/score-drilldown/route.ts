// Per-score drilldown endpoint.
//
// Given an SOP, a program, and a single dimension key, return a 2-3 sentence
// answer to "How do I move this score up?" — specific to THIS draft, not
// generic advice. Backed by a small Claude call.

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { rubrics } from "@/lib/rubrics";
import type { ProgramId } from "@/lib/review-types";

export const runtime = "nodejs";
export const maxDuration = 30;

const VALID_DIMENSIONS = new Set([
  "opening_hook",
  "why_program",
  "technical_specificity",
  "narrative_arc",
  "voice",
  "structure",
]);

interface ParsedRequest {
  sopText: string;
  programId: ProgramId;
  dimensionKey: string;
  currentScore: number;
  admittedMedian: number;
  rationale: string;
}

function parseRequest(body: unknown): ParsedRequest | null {
  if (!body || typeof body !== "object") return null;
  const v = body as Record<string, unknown>;
  if (typeof v.sopText !== "string" || v.sopText.trim().length < 100) return null;
  if (typeof v.programId !== "string") return null;
  if (!(v.programId in rubrics)) return null;
  if (typeof v.dimensionKey !== "string") return null;
  if (!VALID_DIMENSIONS.has(v.dimensionKey)) return null;
  if (typeof v.currentScore !== "number") return null;
  if (typeof v.admittedMedian !== "number") return null;
  if (typeof v.rationale !== "string") return null;
  return {
    sopText: v.sopText.trim(),
    programId: v.programId as ProgramId,
    dimensionKey: v.dimensionKey,
    currentScore: v.currentScore,
    admittedMedian: v.admittedMedian,
    rationale: v.rationale,
  };
}

const systemPrompt = `You are Leap Review's drilldown helper. The student has clicked one specific score in their report and asked "how do I move this up?"

Answer in 2-3 sentences MAX. Be specific to THIS draft — quote a phrase or paragraph the student wrote, then say what to do with it. No generic advice. No hedging. Second person, warm but direct.

Hard rules:
- Reference an actual phrase or section from the SOP. If you can't find one, say so honestly.
- Give one concrete change, not a list.
- Don't repeat the rationale that was already shown to the student.
- No filler like "Great question" or "To improve..." — just answer.`;

export async function POST(request: Request) {
  let parsed: ParsedRequest;
  try {
    const body = await request.json();
    const p = parseRequest(body);
    if (!p) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    parsed = p;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 },
    );
  }

  const rubric = rubrics[parsed.programId];
  const dim = rubric.dimensions.find((d) => d.key === parsed.dimensionKey);
  if (!dim) {
    return NextResponse.json({ error: "Unknown dimension" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const userMessage = `PROGRAM: ${rubric.programName} at ${rubric.university}

DIMENSION: ${dim.label} (${parsed.dimensionKey})
This student scored ${parsed.currentScore}/10. Admitted median is ${parsed.admittedMedian}/10.

The rationale already shown to the student was:
"${parsed.rationale}"

The student's SOP:
"""
${parsed.sopText}
"""

In 2-3 sentences, tell the student what specific change to THEIR draft would move ${dim.label} up. Quote a phrase from their SOP. One concrete change.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    const text = response.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return NextResponse.json({ answer: text });
  } catch (err) {
    console.error("[score-drilldown] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Drilldown failed" },
      { status: 500 },
    );
  }
}
