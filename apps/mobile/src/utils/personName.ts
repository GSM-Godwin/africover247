type NameSource = { firstName?: unknown; lastName?: unknown } | null | undefined

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

export function hasMissingOrPlaceholderName(user: NameSource): boolean {
  const first = clean(user?.firstName).toLowerCase()
  const last = clean(user?.lastName).toLowerCase()
  if (!first && !last) return true
  return first === 'apple' && last === 'user'
}

export function realFirstName(user: NameSource): string {
  return hasMissingOrPlaceholderName(user) ? '' : clean(user?.firstName)
}

export function realLastName(user: NameSource): string {
  return hasMissingOrPlaceholderName(user) ? '' : clean(user?.lastName)
}

export function realFullName(user: NameSource): string {
  return [realFirstName(user), realLastName(user)].filter(Boolean).join(' ')
}
