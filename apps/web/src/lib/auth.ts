const TOKEN_KEY = "africover_token";
const USER_KEY = "africover_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export function setRole(role: string): void {
  document.cookie = `africover_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export function removeRole(): void {
  document.cookie = `africover_role=; path=/; max-age=0`;
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

export function getUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user: Record<string, unknown>): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  removeToken();
  removeUser();
  removeRole();
}

export function getUserDisplayName(user: Record<string, unknown>): string {
  const firstName = String(user.firstName ?? "");
  const lastName = String(user.lastName ?? "");
  const initial = lastName.charAt(0);
  return initial ? `${firstName} ${initial}.` : firstName;
}

export function getUserInitials(user: Record<string, unknown>): string {
  const firstName = String(user.firstName ?? "");
  const lastName = String(user.lastName ?? "");
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
