const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/apple',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/phone/send-otp',
  '/auth/phone/verify-otp',
  '/auth/verify-password',
]

export function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false
  const path = url.split('?')[0].replace(/\/+$/, '')
  return PUBLIC_AUTH_PATHS.some((authPath) => path === authPath || path.endsWith(authPath))
}

export function shouldExpireSession(
  status: number | undefined,
  url: string | undefined,
  hadAuthorizationHeader: boolean,
): boolean {
  return status === 401 && hadAuthorizationHeader && !isAuthEndpoint(url)
}
