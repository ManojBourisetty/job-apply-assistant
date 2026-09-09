export function statusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export function sponsorshipBadgeVariant(
  status: string
): "success" | "secondary" | "warning" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
      return "success";
    case "likely":
      return "secondary";
    case "unlikely":
      return "warning";
    case "not_eligible":
      return "destructive";
    default:
      return "outline";
  }
}

export function applicationStatusBadgeVariant(
  status: string
): "success" | "secondary" | "warning" | "destructive" | "outline" {
  if (["offer"].includes(status)) return "success";
  if (["rejected", "withdrawn", "closed"].includes(status)) return "destructive";
  if (
    [
      "recruiter_screen",
      "technical_interview",
      "hiring_manager_interview",
      "final_interview",
    ].includes(status)
  )
    return "warning";
  if (["applied", "recruiter_contacted"].includes(status)) return "secondary";
  return "outline";
}

export function formatSalary(min?: number | null, max?: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}
