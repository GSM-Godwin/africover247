import { ForbiddenException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export const PAYMENT_STEP_UP_PURPOSE = 'payment-stepup';
export const STEP_UP_TOKEN_HEADER = 'x-step-up-token';
export const STEP_UP_TOKEN_TTL_SECONDS = 10 * 60;

export const STEP_UP_MESSAGES = {
  missing: 'Please confirm your identity before making a payment.',
  expired: 'Your identity confirmation has expired. Please confirm again.',
  invalid: 'Your identity confirmation is not valid. Please confirm again.',
} as const;

interface StepUpTokenPayload {
  sub?: unknown;
  tokenVersion?: unknown;
  purpose?: unknown;
}

@Injectable()
export class StepUpTokenService implements OnModuleInit {
  private readonly logger = new Logger(StepUpTokenService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    if (!this.isEnforced()) {
      this.logger.warn(
        'Payment step-up enforcement is OFF: set ENFORCE_PAYMENT_STEP_UP=true to require X-Step-Up-Token on payment initiation',
      );
    }
  }

  isEnforced(): boolean {
    return this.configService.get<string>('ENFORCE_PAYMENT_STEP_UP') === 'true';
  }

  issue(user: { id: string; tokenVersion: number }): string {
    return this.jwtService.sign(
      { sub: user.id, tokenVersion: user.tokenVersion, purpose: PAYMENT_STEP_UP_PURPOSE },
      {
        secret: this.signingSecret(),
        audience: PAYMENT_STEP_UP_PURPOSE,
        expiresIn: STEP_UP_TOKEN_TTL_SECONDS,
      },
    );
  }

  async assertValid(token: string | undefined, userId: string): Promise<void> {
    if (!token) throw new ForbiddenException(STEP_UP_MESSAGES.missing);

    let payload: StepUpTokenPayload;
    try {
      payload = this.jwtService.verify<StepUpTokenPayload>(token, {
        secret: this.signingSecret(),
        audience: PAYMENT_STEP_UP_PURPOSE,
      });
    } catch (err) {
      throw new ForbiddenException(
        (err as Error)?.name === 'TokenExpiredError'
          ? STEP_UP_MESSAGES.expired
          : STEP_UP_MESSAGES.invalid,
      );
    }

    if (payload.purpose !== PAYMENT_STEP_UP_PURPOSE || payload.sub !== userId) {
      throw new ForbiddenException(STEP_UP_MESSAGES.invalid);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new ForbiddenException(STEP_UP_MESSAGES.invalid);
    }
  }

  private signingSecret(): string {
    return createHmac('sha256', this.configService.getOrThrow<string>('JWT_SECRET'))
      .update(PAYMENT_STEP_UP_PURPOSE)
      .digest('hex');
  }
}
