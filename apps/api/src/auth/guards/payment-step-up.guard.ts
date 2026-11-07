import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { STEP_UP_TOKEN_HEADER, StepUpTokenService } from '../step-up-token.service';

@Injectable()
export class PaymentStepUpGuard implements CanActivate {
  constructor(private stepUpTokenService: StepUpTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.stepUpTokenService.isEnforced()) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const header = request.headers[STEP_UP_TOKEN_HEADER];
    const token = Array.isArray(header) ? header[0] : header;

    await this.stepUpTokenService.assertValid(token, request.user?.id ?? '');
    return true;
  }
}
