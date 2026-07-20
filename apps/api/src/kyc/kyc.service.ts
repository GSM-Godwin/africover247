import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DOJAH_SANDBOX_URL = 'https://sandbox.dojah.io';
const DOJAH_PRODUCTION_URL = 'https://api.dojah.io';

export interface KycResult {
  verified: boolean;
  data: Record<string, unknown> | null;
  message?: string;
}

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly appId: string;
  private readonly privateKey: string;
  private readonly baseUrl: string;
  private readonly isStub: boolean;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('DOJAH_APP_ID') || '';
    this.privateKey = this.configService.get<string>('DOJAH_PRIVATE_KEY') || '';
    const env = this.configService.get<string>('DOJAH_ENV') || 'sandbox';
    this.baseUrl =
      env === 'production' ? DOJAH_PRODUCTION_URL : DOJAH_SANDBOX_URL;

    this.isStub =
      !this.appId ||
      this.appId.includes('placeholder') ||
      !this.privateKey ||
      this.privateKey.includes('placeholder');

    if (this.isStub) {
      this.logger.log('[STUB] Dojah not configured — using stub mode');
    }
  }

  private getHeaders() {
    return {
      AppId: this.appId,
      Authorization: this.privateKey,
    };
  }

  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { message?: string } | undefined;
      return data?.message || error.message || 'KYC verification failed';
    }
    return error instanceof Error ? error.message : 'KYC verification failed';
  }

  private mapResponse(data: unknown, successMessage: string): KycResult {
    const payload = data as { entity?: Record<string, unknown> };
    const verified = Boolean(payload?.entity);
    return {
      verified,
      data: payload?.entity ?? (data as Record<string, unknown>) ?? null,
      message: verified ? successMessage : 'KYC verification failed',
    };
  }

  async verifyBvn(bvn: string): Promise<KycResult> {
    if (this.isStub) {
      this.logger.debug('[STUB] BVN verification');
      return {
        verified: true,
        data: { stub: true },
        message: 'BVN stub verification',
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/kyc/bvn`, {
        params: { bvn },
        headers: this.getHeaders(),
      });
      const result = this.mapResponse(response.data, 'BVN verified');
      this.logger.debug(`BVN verification result: ${result.verified}`);
      return result;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.debug(`BVN verification error: ${message}`);
      return { verified: false, data: null, message };
    }
  }

  async verifyNin(nin: string): Promise<KycResult> {
    if (this.isStub) {
      this.logger.debug('[STUB] NIN verification');
      return {
        verified: true,
        data: { stub: true },
        message: 'NIN stub verification',
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/kyc/nin`, {
        params: { nin },
        headers: this.getHeaders(),
      });
      const result = this.mapResponse(response.data, 'NIN verified');
      this.logger.debug(`NIN verification result: ${result.verified}`);
      return result;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.debug(`NIN verification error: ${message}`);
      return { verified: false, data: null, message };
    }
  }

  async verifyDriversLicence(
    licenceNumber: string,
    dateOfBirth: string,
  ): Promise<KycResult> {
    if (this.isStub) {
      this.logger.debug('[STUB] Drivers licence verification');
      return {
        verified: true,
        data: { stub: true },
        message: 'Drivers licence stub verification',
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/kyc/dl`, {
        params: {
          license_number: licenceNumber,
          first_name: '',
          last_name: '',
          dob: dateOfBirth,
        },
        headers: this.getHeaders(),
      });
      const result = this.mapResponse(
        response.data,
        'Drivers licence verified',
      );
      this.logger.debug(
        `Drivers licence verification result: ${result.verified}`,
      );
      return result;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.debug(`Drivers licence verification error: ${message}`);
      return { verified: false, data: null, message };
    }
  }

  async verifyPassport(
    passportNumber: string,
    lastName: string,
    dateOfBirth: string,
  ): Promise<KycResult> {
    if (this.isStub) {
      this.logger.debug('[STUB] Passport verification');
      return {
        verified: true,
        data: { stub: true },
        message: 'Passport stub verification',
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/kyc/passport`,
        {
          passport_number: passportNumber,
          last_name: lastName,
          dob: dateOfBirth,
        },
        { headers: this.getHeaders() },
      );
      const result = this.mapResponse(response.data, 'Passport verified');
      this.logger.debug(`Passport verification result: ${result.verified}`);
      return result;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.debug(`Passport verification error: ${message}`);
      return { verified: false, data: null, message };
    }
  }
}
