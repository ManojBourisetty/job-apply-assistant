import { Briefcase } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="size-5" />
          </div>
          <h1 className="text-xl font-semibold">JobPilot</h1>
          <p className="text-sm text-muted-foreground">
            Your personal job search operating system.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
