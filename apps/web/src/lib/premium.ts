function toPositiveNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function resolveAnnualPremium(
  productPremiumAmount: string | number | null | undefined,
  formData: Record<string, unknown> | null | undefined,
): number {
  return (
    toPositiveNumber(productPremiumAmount) ??
    toPositiveNumber(formData?.calculatedPremium) ??
    toPositiveNumber(formData?.quotedPremium) ??
    0
  );
}

export function monthlyInstalment(annualPremium: number): number {
  return annualPremium ? Math.ceil(annualPremium / 12) : 0;
}
