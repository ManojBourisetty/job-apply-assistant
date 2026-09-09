"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ResumeContent } from "@/lib/resume-types";
import { resumeContentToText } from "@/lib/resume-format";

export function DownloadResumeButton({
  content,
  filename,
}: {
  content: ResumeContent;
  filename: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        const text = resumeContentToText(content);
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}
    >
      <Download /> Download
    </Button>
  );
}
