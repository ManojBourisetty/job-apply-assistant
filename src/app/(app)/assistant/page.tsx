import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { isAiConfigured } from "@/lib/ai";

export default function AssistantPage() {
  return (
    <div>
      <PageHeader
        title="Job Search Assistant"
        description="Ask questions grounded in your own stored jobs, applications, and analytics."
      />
      {!isAiConfigured() ? (
        <EmptyState
          icon={Sparkles}
          badge="AI not configured"
          title="No AI provider is configured"
          description="Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) in your environment to enable the assistant."
        />
      ) : (
        <AssistantChat />
      )}
    </div>
  );
}
