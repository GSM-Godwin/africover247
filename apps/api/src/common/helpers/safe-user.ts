export function safeUser<
  T extends { passwordHash?: string | null; appleRefreshToken?: string | null },
>(user: T): Omit<T, 'passwordHash' | 'appleRefreshToken'> {
  const { passwordHash, appleRefreshToken, ...rest } = user;
  return rest;
}
