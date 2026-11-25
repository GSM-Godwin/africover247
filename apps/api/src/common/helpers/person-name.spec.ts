import {
  customerFullName,
  greetingName,
  hasMissingOrPlaceholderName,
  normalizePersonName,
  PERSON_NAME_MAX_LENGTH,
} from './person-name';

describe('person-name helpers', () => {
  it('normalizes whitespace, non-strings and overlong values', () => {
    expect(normalizePersonName('  Ada   Ngozi ')).toBe('Ada Ngozi');
    expect(normalizePersonName(undefined)).toBe('');
    expect(normalizePersonName(42)).toBe('');
    expect(normalizePersonName('x'.repeat(80))).toHaveLength(
      PERSON_NAME_MAX_LENGTH,
    );
  });

  it('detects empty and Apple placeholder names only', () => {
    expect(hasMissingOrPlaceholderName({ firstName: '', lastName: '' })).toBe(
      true,
    );
    expect(
      hasMissingOrPlaceholderName({ firstName: 'Apple', lastName: 'User' }),
    ).toBe(true);
    expect(
      hasMissingOrPlaceholderName({ firstName: 'apple', lastName: 'user' }),
    ).toBe(true);
    expect(
      hasMissingOrPlaceholderName({ firstName: 'Apple', lastName: 'Okafor' }),
    ).toBe(false);
    expect(
      hasMissingOrPlaceholderName({ firstName: 'Ada', lastName: '' }),
    ).toBe(false);
  });

  it('greets with a neutral fallback instead of a missing or placeholder name', () => {
    expect(greetingName('Ada')).toBe('Ada');
    expect(greetingName('')).toBe('Customer');
    expect(greetingName('Apple')).toBe('Customer');
    expect(greetingName(null)).toBe('Customer');
  });

  it('builds a full name that never shows the Apple placeholder', () => {
    expect(customerFullName({ firstName: 'Ada', lastName: 'Okafor' })).toBe(
      'Ada Okafor',
    );
    expect(customerFullName({ firstName: 'Ada', lastName: '' })).toBe('Ada');
    expect(customerFullName({ firstName: 'Apple', lastName: 'User' })).toBe(
      'Customer',
    );
    expect(customerFullName({ firstName: '', lastName: '' })).toBe('Customer');
  });
});
