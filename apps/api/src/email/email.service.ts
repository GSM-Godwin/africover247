import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: any;

  constructor(private configService: ConfigService) {
    // TODO: swap console stub for real Resend client once API key is confirmed
    const apiKey = this.configService.get<string>('EMAIL_API_KEY');
    if (apiKey && apiKey !== 'placeholder_fill_before_day3') {
      const { Resend } = require('resend');
      this.resend = new Resend(apiKey);
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.log(`[STUB] OTP for ${to}: ${otp}`);
        return;
      }
      await this.resend.emails.send({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject: 'Verify your AfriCover247 account',
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
      });
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
    }
  }

  async sendPasswordResetEmail(to: string, otp: string): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.log(`[STUB] Password reset OTP for ${to}: ${otp}`);
        return;
      }
      await this.resend.emails.send({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject: 'Reset your AfriCover247 password',
        html: `<p>Your password reset code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
    }
  }

  async sendPolicyIssuedEmail(
    to: string,
    policyNumber: string,
    downloadUrl: string,
  ): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.log(`[STUB] Policy issued email for ${to}: ${policyNumber}`);
        return;
      }
      await this.resend.emails.send({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject: `Your AfriCover247 Policy is Ready — ${policyNumber}`,
        html: `<p>Congratulations! Your policy <strong>${policyNumber}</strong> has been issued.</p><p><a href="${downloadUrl}">Download your policy</a></p>`,
      });
    } catch (error) {
      this.logger.error(`Failed to send policy email to ${to}`, error);
    }
  }

  async sendClaimStatusEmail(
    to: string,
    claimReference: string,
    newStatus: string,
    note?: string,
  ): Promise<void> {
    try {
      if (!this.resend) {
        this.logger.log(
          `[STUB] Claim status email for ${to}: ${claimReference} → ${newStatus}`,
        );
        return;
      }
      await this.resend.emails.send({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject: `Your claim ${claimReference} has been updated`,
        html: `<p>Your claim status has been updated to <strong>${newStatus}</strong>.</p>${note ? `<p>${note}</p>` : ''}`,
      });
    } catch (error) {
      this.logger.error(`Failed to send claim status email to ${to}`, error);
    }
  }
}
