export type AiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GenerateTextOptions = {
  system: string;
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
};

export type GenerateTextResult = {
  text: string;
  model: string;
  provider: "anthropic" | "openai";
};

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "No AI provider is configured. Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) in your environment."
    );
    this.name = "AiNotConfiguredError";
  }
}
