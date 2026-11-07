import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export const PASSWORD_MAX_FAILED_ATTEMPTS = 5;
export const PASSWORD_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const PRUNE_THRESHOLD = 10_000;

interface AttemptWindow {
  failures: number;
  windowStartedAt: number;
}

@Injectable()
export class PasswordAttemptLimiterService {
  private readonly windows = new Map<string, AttemptWindow>();

  assertAllowed(userId: string): void {
    const now = Date.now();
    const window = this.activeWindow(userId, now);
    if (window && window.failures >= PASSWORD_MAX_FAILED_ATTEMPTS) {
      const minutesLeft = Math.max(
        1,
        Math.ceil((window.windowStartedAt + PASSWORD_ATTEMPT_WINDOW_MS - now) / 60_000),
      );
      throw new HttpException(
        `Too many incorrect password attempts. Please try again in ${minutesLeft} ${
          minutesLeft === 1 ? 'minute' : 'minutes'
        }.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(userId: string): void {
    const now = Date.now();
    const window = this.activeWindow(userId, now);
    if (window) {
      window.failures += 1;
    } else {
      this.windows.set(userId, { failures: 1, windowStartedAt: now });
    }
    if (this.windows.size > PRUNE_THRESHOLD) this.pruneExpired(now);
  }

  reset(userId: string): void {
    this.windows.delete(userId);
  }

  private activeWindow(userId: string, now: number): AttemptWindow | null {
    const window = this.windows.get(userId);
    if (!window) return null;
    if (now - window.windowStartedAt >= PASSWORD_ATTEMPT_WINDOW_MS) {
      this.windows.delete(userId);
      return null;
    }
    return window;
  }

  private pruneExpired(now: number): void {
    for (const [userId, window] of this.windows) {
      if (now - window.windowStartedAt >= PASSWORD_ATTEMPT_WINDOW_MS) {
        this.windows.delete(userId);
      }
    }
  }
}
