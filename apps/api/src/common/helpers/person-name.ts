export const PERSON_NAME_MAX_LENGTH = 50;
export const FALLBACK_CUSTOMER_NAME = 'Customer';

const PLACEHOLDER_FIRST_NAME = 'apple';
const PLACEHOLDER_LAST_NAME = 'user';

type NameParts = { firstName?: string | null; lastName?: string | null };

export function normalizePersonName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, PERSON_NAME_MAX_LENGTH);
}

export function hasMissingOrPlaceholderName(user: NameParts): boolean {
  const first = normalizePersonName(user.firstName).toLowerCase();
  const last = normalizePersonName(user.lastName).toLowerCase();
  if (!first && !last) return true;
  return first === PLACEHOLDER_FIRST_NAME && last === PLACEHOLDER_LAST_NAME;
}

export function greetingName(firstName: string | null | undefined): string {
  const first = normalizePersonName(firstName);
  if (!first || first.toLowerCase() === PLACEHOLDER_FIRST_NAME) {
    return FALLBACK_CUSTOMER_NAME;
  }
  return first;
}

export function customerFullName(user: NameParts): string {
  if (hasMissingOrPlaceholderName(user)) return FALLBACK_CUSTOMER_NAME;
  return [
    normalizePersonName(user.firstName),
    normalizePersonName(user.lastName),
  ]
    .filter(Boolean)
    .join(' ');
}
