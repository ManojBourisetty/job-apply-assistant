import type { GenerateTextOptions, GenerateTextResult } from "./types";

// Bare current model ID — never a dated snapshot suffix, which gets retired.
// Override via ANTHROPIC_MODEL (e.g. "claude-haiku-4-5" for the cheapest tier).
const DEFAULT_MODEL = "claude-sonnet-5";

export async function generateWithAnthropic(
  options: GenerateTextOptions
): Promise<GenerateTextResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 4096,
      // Current models (Sonnet 5, Opus 5, ...) default to adaptive thinking,
      // which rejects sampling params (temperature/top_p/top_k) with a 400 —
      // so `temperature` is intentionally omitted rather than disabling
      // thinking (disabling it on Opus-tier models can leak <thinking> tags
      // into the visible text, which would corrupt the JSON parsing below).
      system: options.system,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = (data.content ?? [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("\n");

  return { text, model, provider: "anthropic" };
}
