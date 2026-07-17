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

export function applicationStep(stepCompleted: number): number {
  return Math.min(stepCompleted + 1, 4);
}
