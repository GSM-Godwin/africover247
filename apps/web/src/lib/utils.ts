export function splitLines(str: string): string[] {
  return str
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatNaira(amount: string | number): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₦${value.toLocaleString("en-NG")}`;
}

export function premiumSuffix(frequency: string): string {
  if (frequency.toLowerCase() === "annual") return "/year";
  if (frequency.toLowerCase() === "monthly") return "/month";
  return `/${frequency}`;
}

export function productDisplayTitle(name: string): string {
  if (/insurance/i.test(name)) return name;
  return `${name} Insurance`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG");
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function formatExpiryShort(iso: string): string {
  const date = new Date(iso);
  return `Exp ${date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  })}`;
}

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function formatPolicyDateRange(
  startDate: string,
  expiryDate: string,
): string {
  return `${formatMonthYear(startDate)} – ${formatMonthYear(expiryDate)}`;
}

export function greetingPeriod(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function applicationStep(stepCompleted: number): number {
  return Math.min(stepCompleted + 1, 4);
}
