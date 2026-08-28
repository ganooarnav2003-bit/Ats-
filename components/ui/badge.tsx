import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-stone-100 text-stone-700 ring-stone-200",
    info: "bg-teal-50 text-teal-800 ring-teal-200",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    warning: "bg-amber-50 text-amber-900 ring-amber-200",
    danger: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function goalStatusTone(status: string) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "submitted":
      return "info" as const;
    case "sent_back":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function reviewStatusTone(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "manager_reviewed":
      return "info" as const;
    case "self_appraisal_submitted":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function cycleStatusTone(status: string) {
  switch (status) {
    case "open":
      return "success" as const;
    case "closed":
      return "neutral" as const;
    default:
      return "warning" as const;
  }
}
