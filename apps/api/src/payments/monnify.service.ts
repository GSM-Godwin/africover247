import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

const MONNIFY_SANDBOX_URL = 'https://sandbox.monnify.com';
const MONNIFY_PROD_URL = 'https://api.monnify.com';

@Injectable()
export class MonnifyService {
  private readonly logger = new Logger(MonnifyService.name);
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly contractCode: string;
  private readonly baseUrl: string;
  private readonly isStub: boolean;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MONNIFY_API_KEY') || '';
    this.secretKey = this.configService.get<string>('MONNIFY_SECRET_KEY') || '';
    this.contractCode =
      this.configService.get<string>('MONNIFY_CONTRACT_CODE') || '';
    const env = this.configService.get<string>('MONNIFY_ENV') || 'sandbox';
    this.baseUrl = env === 'production' ? MONNIFY_PROD_URL : MONNIFY_SANDBOX_URL;

    this.isStub =
      !this.apiKey ||
      this.apiKey === 'placeholder' ||
      !this.secretKey ||
      this.secretKey === 'placeholder';

    if (this.isStub) {
      this.logger.log('[STUB] Monnify not configured — using stub mode');
    }
  }

  // --- Get access token ---

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString(
      'base64',
    );
    const response = await axios.post(
      `${this.baseUrl}/api/v1/auth/login`,
      {},
      { headers: { Authorization: `Basic ${credentials}` } },
    );

    this.accessToken = response.data.responseBody.accessToken;
    this.tokenExpiry = Date.now() + 55 * 60 * 1000;
    return this.accessToken!;
  }

  // --- Initialise transaction ---

  async initializeTransaction(data: {
    amount: number;
    email: string;
    reference: string;
    name: string;
    callbackUrl: string;
    description?: string;
  }): Promise<{ checkoutUrl: string; reference: string }> {
    if (this.isStub) {
      this.logger.log(
        `[STUB] Monnify init for ${data.email} — amount: ₦${data.amount}`,
      );
      return {
        checkoutUrl: `${data.callbackUrl}?reference=${data.reference}&status=paid`,
        reference: data.reference,
      };
    }

    const token = await this.getAccessToken();
    const response = await axios.post(
      `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
      {
        amount: data.amount,
        customerName: data.name,
        customerEmail: data.email,
        paymentReference: data.reference,
        paymentDescription:
          data.description || 'AfriCover247 Insurance Premium',
        currencyCode: 'NGN',
        contractCode: this.contractCode,
        redirectUrl: data.callbackUrl,
        paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'],
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return {
      checkoutUrl: response.data.responseBody.checkoutUrl,
      reference: data.reference,
    };
  }

  // --- Verify webhook signature ---

  verifyWebhookSignature(body: string, signature: string): boolean {
    if (this.isStub) {
      this.logger.log('[STUB] Monnify webhook signature verification bypassed');
      return true;
    }

    if (!signature) {
      this.logger.warn('Monnify webhook: no signature header received');
      return false;
    }

    try {
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(body)
        .digest('hex');

      this.logger.log(`Signature check — computed: ${hash}`);
      this.logger.log(`Signature check — received: ${signature}`);

      return hash === signature;
    } catch (error) {
      this.logger.error('Webhook signature verification error', error);
      return false;
    }
  }

  // --- Verify transaction ---

  async verifyTransaction(reference: string): Promise<{
    status: string;
    amount: number;
    reference: string;
    gatewayResponse: object;
  }> {
    if (this.isStub) {
      this.logger.log(`[STUB] Monnify verifying transaction ${reference}`);
      return {
        status: 'PAID',
        amount: 0,
        reference,
        gatewayResponse: { stub: true },
      };
    }

    const token = await this.getAccessToken();
    const encodedReference = encodeURIComponent(reference);
    const response = await axios.get(
      `${this.baseUrl}/api/v2/transactions/${encodedReference}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const data = response.data.responseBody;
    return {
      status: data.paymentStatus,
      amount: data.amountPaid,
      reference: data.paymentReference,
      gatewayResponse: data,
    };
  }
}
