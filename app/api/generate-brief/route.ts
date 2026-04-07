import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { universities } from "@/lib/universities";
import { briefToolSchema, buildUserMessage, systemPrompt } from "@/lib/prompts";
import { fixtureBrief } from "@/lib/fixtures";
import type { Brief, GenerateBriefResponse, Profile } from "@/lib/types";

export const runtime = "nodejs";

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.intake === "string" &&
    Array.isArray(v.countries) &&
    typeof v.field === "string" &&
    typeof v.degree === "string" &&
    typeof v.gpa === "number" &&
    (v.gpaScale === "10" || v.gpaScale === "4") &&
    typeof v.ielts === "number" &&
    typeof v.workExperienceYears === "number" &&
    typeof v.budgetLakhs === "number"
  );
}

export async function POST(request: Request) {
  let profile: Profile;
  try {
    const body = await request.json();
    if (!isProfile(body)) {
      return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
    }
    profile = body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key → fixture path. UI stays demoable.
  if (!apiKey) {
    const brief: Brief = {
      ...fixtureBrief(profile),
      studentName: profile.name || "Demo Student",
      generatedAt: new Date().toISOString(),
    };
    const payload: GenerateBriefResponse = { brief, source: "fixture" };
    return NextResponse.json(payload);
  }

  // Filter the candidate set to the student's chosen countries to keep the
  // prompt small and focused. Falls back to full set if filter is empty.
  const candidates = universities.filter((u) =>
    profile.countries.includes(u.country),
  );
  const candidateSet = candidates.length >= 6 ? candidates : universities;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [briefToolSchema as never],
      tool_choice: { type: "tool", name: "emit_brief" },
      messages: [
        { role: "user", content: buildUserMessage(profile, candidateSet) },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model did not call emit_brief");
    }

    const briefBody = toolUse.input as Omit<Brief, "studentName" | "generatedAt">;

    const brief: Brief = {
      studentName: profile.name || "Demo Student",
      generatedAt: new Date().toISOString(),
      ...briefBody,
    };

    const payload: GenerateBriefResponse = { brief, source: "live" };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[generate-brief] Claude call failed:", err);
    // Fall back to fixture rather than blank-screen the demo.
    const brief: Brief = {
      ...fixtureBrief(profile),
      studentName: profile.name || "Demo Student",
      generatedAt: new Date().toISOString(),
    };
    const payload: GenerateBriefResponse = { brief, source: "fixture" };
    return NextResponse.json(payload);
  }
}
