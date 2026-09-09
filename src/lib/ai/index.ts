import { generateWithAnthropic } from "./anthropic";
import { generateWithOpenAi } from "./openai";
import { AiNotConfiguredError, type GenerateTextOptions, type GenerateTextResult } from "./types";

export { AiNotConfiguredError };
export type { GenerateTextOptions, GenerateTextResult, AiMessage } from "./types";

export function isAiConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

export function activeProviderName(): "anthropic" | "openai" | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

// Provider-agnostic entry point. Swap providers purely via environment
// variables — nothing else in the app should import anthropic.ts/openai.ts
// directly, so a provider migration touches only this file.
export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  if (process.env.ANTHROPIC_API_KEY) return generateWithAnthropic(options);
  if (process.env.OPENAI_API_KEY) return generateWithOpenAi(options);
  throw new AiNotConfiguredError();
}
