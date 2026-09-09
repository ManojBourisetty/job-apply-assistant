"use client";

import * as React from "react";
import { Loader2, Send, Sparkles, Bot, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { askAssistant } from "@/lib/actions/assistant";
import type { AiMessage } from "@/lib/ai/types";

const SUGGESTIONS = [
  "Which applications need follow-up this week?",
  "Which companies have responded to me most often?",
  "Show me jobs where I meet at least 90% of requirements.",
  "What skills are appearing most frequently in my target jobs?",
];

export function AssistantChat() {
  const [messages, setMessages] = React.useState<AiMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  function send(question: string) {
    if (!question.trim() || pending) return;
    const nextMessages: AiMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");

    startTransition(async () => {
      const result = await askAssistant(question, messages);
      if ("error" in result) {
        toast.error(result.error);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    });
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="flex h-full flex-col gap-4 overflow-y-auto pt-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <Sparkles className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Ask about your applications, jobs, or search progress — answers are grounded in your
                own stored data.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Bot className="size-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}
          {pending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask about your job search…"
          rows={2}
          className="resize-none"
        />
        <Button type="submit" disabled={pending || !input.trim()}>
          <Send />
        </Button>
      </form>
    </div>
  );
}
