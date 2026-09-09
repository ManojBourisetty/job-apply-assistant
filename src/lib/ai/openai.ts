import type { GenerateTextOptions, GenerateTextResult } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";

export async function generateWithOpenAi(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
      messages: [
        { role: "system", content: options.system },
        ...options.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  return { text, model, provider: "openai" };
}
