export function safeUser<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash, ...rest } = user as T & { passwordHash?: string | null };
  return rest;
}
