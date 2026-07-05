import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly isStub: boolean;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.isStub =
      !this.secretKey || this.secretKey === 'placeholder_fill_before_day10';
  }

  // --- Initialise transaction ---

  async initializeTransaction(data: {
    email: string;
    amount: number;
    reference: string;
    callbackUrl: string;
    metadata?: object;
  }): Promise<{ authorizationUrl: string; reference: string }> {
    if (this.isStub) {
      this.logger.log(
        `[STUB] Paystack init for ${data.email} — amount: ₦${data.amount / 100}`,
      );
      return {
        authorizationUrl: `http://localhost:3000/payment/callback?reference=${data.reference}&trxref=${data.reference}`,
        reference: data.reference,
      };
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        callback_url: data.callbackUrl,
        metadata: data.metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    };
  }

  // --- Verify webhook signature ---

  verifyWebhookSignature(body: string, signature: string): boolean {
    if (this.isStub) {
      this.logger.log('[STUB] Webhook signature verification bypassed');
      return true;
    }

    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(body)
      .digest('hex');

    return hash === signature;
  }

  // --- Verify transaction ---

  async verifyTransaction(reference: string): Promise<{
    status: string;
    amount: number;
    reference: string;
    gatewayResponse: object;
  }> {
    if (this.isStub) {
      this.logger.log(`[STUB] Verifying transaction ${reference}`);
      return {
        status: 'success',
        amount: 0,
        reference,
        gatewayResponse: { stub: true },
      };
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      },
    );

    const { data } = response.data;
    return {
      status: data.status,
      amount: data.amount,
      reference: data.reference,
      gatewayResponse: data,
    };
  }
}
