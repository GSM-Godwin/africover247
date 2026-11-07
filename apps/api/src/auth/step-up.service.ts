import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { StepUpTokenService } from './step-up-token.service';

export const STEP_UP_CODE_TTL_MS = 10 * 60 * 1000;
export const STEP_UP_RESEND_COOLDOWN_MS = 60 * 1000;
export const STEP_UP_SEND_WINDOW_MS = 30 * 60 * 1000;
export const STEP_UP_MAX_SENDS_PER_WINDOW = 5;
export const STEP_UP_MAX_ATTEMPTS = 5;

interface StepUpUser {
  id: string;
  email: string;
  firstName: string;
  emailVerified: boolean;
  googleId: string | null;
  appleId: string | null;
  suspended: boolean;
  deletedAt: Date | null;
  tokenVersion: number;
}

function tooManyRequests(message: string) {
  return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
}

function secondsUntil(target: number, now: number) {
  return Math.max(1, Math.ceil((target - now) / 1000));
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(1, Math.min(local.length - 1, 6)))}@${domain}`;
}

@Injectable()
export class StepUpService {
  private readonly logger = new Logger(StepUpService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
    private stepUpTokenService: StepUpTokenService,
  ) {}

  async sendEmailCode(userId: string) {
    const user = await this.loadEligibleUser(userId);
    const now = Date.now();
    const existing = await this.prisma.stepUpCode.findUnique({ where: { userId } });

    if (existing) {
      const resendAt = existing.lastSentAt.getTime() + STEP_UP_RESEND_COOLDOWN_MS;
      if (now < resendAt) {
        throw tooManyRequests(
          `Please wait ${secondsUntil(resendAt, now)} seconds before requesting a new code.`,
        );
      }
    }

    const windowActive =
      !!existing && now - existing.windowStartedAt.getTime() < STEP_UP_SEND_WINDOW_MS;
    if (windowActive && existing.sendCount >= STEP_UP_MAX_SENDS_PER_WINDOW) {
      const windowEndsAt = existing.windowStartedAt.getTime() + STEP_UP_SEND_WINDOW_MS;
      throw tooManyRequests(
        `Too many codes requested. Please try again in ${Math.ceil(
          secondsUntil(windowEndsAt, now) / 60,
        )} minutes.`,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeFields = {
      codeHash: this.hashCode(userId, code),
      expiresAt: new Date(now + STEP_UP_CODE_TTL_MS),
      attempts: 0,
      lastSentAt: new Date(now),
      sendCount: windowActive ? existing.sendCount + 1 : 1,
      windowStartedAt: windowActive ? existing.windowStartedAt : new Date(now),
    };

    await this.prisma.stepUpCode.upsert({
      where: { userId },
      create: { userId, ...codeFields },
      update: codeFields,
    });

    await this.emailService.sendOtpEmail(user.email, code, user.firstName);
    this.logger.log(`Step-up code issued for user ${userId}`);

    return {
      message: 'We sent a code to your email.',
      maskedEmail: maskEmail(user.email),
      expiresInSeconds: STEP_UP_CODE_TTL_MS / 1000,
      resendAvailableInSeconds: STEP_UP_RESEND_COOLDOWN_MS / 1000,
    };
  }

  async verifyEmailCode(userId: string, code: string) {
    const user = await this.loadEligibleUser(userId);
    const record = await this.prisma.stepUpCode.findUnique({ where: { userId } });

    if (!record || !record.codeHash) {
      throw new BadRequestException('No active code. Please request a new one.');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This code has expired. Please request a new one.');
    }

    const counted = await this.prisma.stepUpCode.updateMany({
      where: { userId, attempts: { lt: STEP_UP_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (counted.count === 0) {
      throw tooManyRequests('Too many incorrect attempts. Please request a new code.');
    }

    if (!this.matches(record.codeHash, this.hashCode(userId, code))) {
      const remaining = STEP_UP_MAX_ATTEMPTS - (record.attempts + 1);
      throw new BadRequestException(
        remaining > 0
          ? `Incorrect code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left.`
          : 'Incorrect code. Please request a new code.',
      );
    }

    await this.prisma.stepUpCode.delete({ where: { userId } });
    return { verified: true, stepUpToken: this.stepUpTokenService.issue(user) };
  }

  private async loadEligibleUser(userId: string): Promise<StepUpUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
        googleId: true,
        appleId: true,
        suspended: true,
        deletedAt: true,
        tokenVersion: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('This account has been deleted.');
    }
    if (user.suspended) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }
    if (!user.googleId && !user.appleId) {
      throw new BadRequestException(
        'Email codes are only available for Google or Apple sign-in. Please use your password.',
      );
    }
    if (!user.emailVerified) {
      throw new BadRequestException(
        'Your email address is not verified. Please contact support.',
      );
    }
    return user;
  }

  private hashCode(userId: string, code: string): string {
    const key = createHmac('sha256', this.configService.getOrThrow<string>('JWT_SECRET'))
      .update('step-up-email-code')
      .digest();
    return createHmac('sha256', key).update(`${userId}:${code}`).digest('hex');
  }

  private matches(storedHash: string, candidateHash: string): boolean {
    const stored = Buffer.from(storedHash, 'hex');
    const candidate = Buffer.from(candidateHash, 'hex');
    return stored.length === candidate.length && timingSafeEqual(stored, candidate);
  }
}
