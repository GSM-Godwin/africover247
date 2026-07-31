import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const TERMII_SANDBOX_URL = 'https://sandbox.termii.com/api';
const TERMII_PRODUCTION_URL = 'https://api.ng.termii.com/api';
const OTP_VALIDITY_MINUTES = 10;

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl: string;
  private readonly isStub: boolean;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TERMII_API_KEY') || '';
    this.senderId =
      this.configService.get<string>('TERMII_SENDER_ID') || 'AfriCover';
    const env = this.configService.get<string>('TERMII_ENV') || 'sandbox';
    this.baseUrl =
      env === 'production' ? TERMII_PRODUCTION_URL : TERMII_SANDBOX_URL;

    this.isStub =
      !this.apiKey ||
      this.apiKey === 'placeholder' ||
      this.apiKey.includes('placeholder');

    if (this.isStub) {
      this.logger.log('[STUB] Termii not configured — using stub mode');
    }
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    await axios.post(`${this.baseUrl}/sms/send`, {
      to: phone,
      from: this.senderId,
      sms: message,
      type: 'plain',
      channel: 'dnd',
      api_key: this.apiKey,
    });
  }

  async sendOtpSms(phone: string, otp: string): Promise<void> {
    this.logger.log(`[SMS] sendOtpSms called for ${phone} — stub: ${this.isStub}`);
    if (this.isStub) {
      this.logger.log(`[STUB] SMS OTP to ${phone}: ${otp}`);
      return;
    }

    try {
      await this.sendSms(
        phone,
        `Your AfriCover247 verification code is: ${otp}. Valid for ${OTP_VALIDITY_MINUTES} minutes.`,
      );
      this.logger.log(`[SMS] OTP sent successfully to ${phone}`);
    } catch (err: any) {
      this.logger.error(
        `[SMS] Failed to send OTP to ${phone}: ${err?.response?.data ? JSON.stringify(err.response.data) : err?.message}`,
      );
    }
  }

  async sendPaymentConfirmationSms(
    phone: string,
    amount: number,
    policyNumber: string,
  ): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] SMS payment confirmation to ${phone}`);
      return;
    }

    try {
      await this.sendSms(
        phone,
        `Payment of N${amount.toLocaleString()} received. Your AfriCover247 policy ${policyNumber} is being issued. Check your email for your policy document.`,
      );
    } catch (err: any) {
      this.logger.error(
        `[SMS] Failed to send to ${phone}: ${err?.response?.data ? JSON.stringify(err.response.data) : err?.message}`,
      );
    }
  }

  async sendClaimStatusSms(
    phone: string,
    claimReference: string,
    status: string,
  ): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] SMS claim status to ${phone}`);
      return;
    }

    try {
      await this.sendSms(
        phone,
        `Your AfriCover247 claim ${claimReference} has been updated to ${status}. Log in to track your claim.`,
      );
    } catch (err: any) {
      this.logger.error(
        `[SMS] Failed to send to ${phone}: ${err?.response?.data ? JSON.stringify(err.response.data) : err?.message}`,
      );
    }
  }

  async sendPolicyIssuedSms(
    phone: string,
    policyNumber: string,
  ): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] SMS policy issued to ${phone}`);
      return;
    }

    try {
      await this.sendSms(
        phone,
        `Your AfriCover247 policy ${policyNumber} has been issued. Check your email to download your policy document.`,
      );
    } catch (err: any) {
      this.logger.error(
        `[SMS] Failed to send to ${phone}: ${err?.response?.data ? JSON.stringify(err.response.data) : err?.message}`,
      );
    }
  }

  async sendNotificationSms(phone: string, message: string): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] SMS to ${phone}: ${message}`);
      return;
    }

    try {
      await this.sendSms(phone, message);
    } catch (err: any) {
      this.logger.error(
        `[SMS] Failed to send to ${phone}: ${err?.response?.data ? JSON.stringify(err.response.data) : err?.message}`,
      );
    }
  }
}
