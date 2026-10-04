import { NextResponse } from "next/server";

const FALLBACKS: Record<string, string> = {
  "": "Try a challenge: survive 30 seconds, then push for a perfect run. I can also help brainstorm your next game.",
  "tips": "For Neon Dodge, keep moving in small controlled bursts. Stay near the center until you can read the next obstacle.",
};

function fallback(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("tip") || normalized.includes("help") || normalized.includes("how")) {
    return FALLBACKS.tips;
  }
  if (normalized.includes("game") || normalized.includes("idea") || normalized.includes("build")) {
    return "Game idea: “Skyline Sprint” — a 60-second parkour runner where AI creates a new obstacle pattern every round.";
  }
  return FALLBACKS[""];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim() ?? "";

    if (!prompt) {
      return NextResponse.json({ answer: fallback("") });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        answer: fallback(prompt),
        mode: "local",
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions:
          "You are GameForge AI, a friendly game coach and game-design copilot. Keep answers concise, practical, and age-appropriate. Help with game strategy, ideas, UI, and beginner-friendly coding concepts. Never give advice involving dangerous activities.",
        input: prompt,
        max_output_tokens: 350,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ answer: fallback(prompt), mode: "local-error" }, { status: 200 });
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ text?: string }>;
      }>;
    };

    const answer =
      data.output_text ||
      data.output?.flatMap((item) => item.content ?? [])
        .map((item) => item.text)
        .filter(Boolean)
        .join("\n") ||
      fallback(prompt);

    return NextResponse.json({ answer, mode: "ai" });
  } catch {
    return NextResponse.json({
      answer: "I hit a temporary snag. Try that again in a second.",
      mode: "error",
    }, { status: 200 });
  }
}
