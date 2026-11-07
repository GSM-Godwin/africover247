const LINKED_QUOTE_KEYS = ['fromQuoteId', 'quoteId'] as const;

export function linkedQuoteId(formData: unknown): string | null {
  if (typeof formData !== 'object' || formData === null || Array.isArray(formData)) {
    return null;
  }
  const record = formData as Record<string, unknown>;
  for (const key of LINKED_QUOTE_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}
