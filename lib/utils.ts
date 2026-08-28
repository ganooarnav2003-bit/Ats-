import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function weightedAverage(
  items: { weightage: number; rating: number | null }[],
): number | null {
  const ready = items.filter((item) => item.rating != null);
  if (!ready.length) return null;
  const totalWeight = ready.reduce((sum, item) => sum + item.weightage, 0);
  if (totalWeight === 0) return null;
  const weighted = ready.reduce(
    (sum, item) => sum + item.weightage * (item.rating as number),
    0,
  );
  return Math.round((weighted / totalWeight) * 100) / 100;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
