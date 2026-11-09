jest.mock('axios');

import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MonnifyService } from './monnify.service';

const SECRET = 'unit-test-secret-key';

function buildConfigService(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    MONNIFY_API_KEY: 'unit-test-api-key',
    MONNIFY_SECRET_KEY: SECRET,
    MONNIFY_CONTRACT_CODE: 'unit-test-contract',
    MONNIFY_ENV: 'sandbox',
    NODE_ENV: 'test',
    ...overrides,
  };
  return { get: jest.fn((key: string) => values[key]) };
}

async function createMonnifyService(overrides?: Record<string, string>) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MonnifyService,
      { provide: ConfigService, useValue: buildConfigService(overrides) },
    ],
  }).compile();
  return module.get(MonnifyService);
}

describe('MonnifyService', () => {
  describe('verifyWebhookSignature with real credentials configured', () => {
    let service: MonnifyService;

    beforeEach(async () => {
      service = await createMonnifyService();
    });

    it('accepts a signature matching the HMAC sha512 of the raw body', () => {
      const rawBody = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION' });
      const signature = crypto
        .createHmac('sha512', SECRET)
        .update(rawBody)
        .digest('hex');

      expect(service.verifyWebhookSignature(rawBody, signature)).toBe(true);
    });

    it('rejects a same-length signature that does not match, via timingSafeEqual', () => {
      const rawBody = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION' });
      const correct = crypto
        .createHmac('sha512', SECRET)
        .update(rawBody)
        .digest('hex');
      const flippedChar = correct[0] === '0' ? '1' : '0';
      const tampered = `${flippedChar}${correct.slice(1)}`;

      expect(tampered).toHaveLength(correct.length);
      expect(service.verifyWebhookSignature(rawBody, tampered)).toBe(false);
    });

    it('rejects a signature computed over a different body', () => {
      const rawBody = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION' });
      const signatureForOtherBody = crypto
        .createHmac('sha512', SECRET)
        .update('a different payload')
        .digest('hex');

      expect(
        service.verifyWebhookSignature(rawBody, signatureForOtherBody),
      ).toBe(false);
    });

    it('rejects when the signature header is missing', () => {
      const rawBody = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION' });
      expect(service.verifyWebhookSignature(rawBody, '')).toBe(false);
    });

    it('rejects a signature with a different byte length before comparing', () => {
      const rawBody = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION' });
      expect(service.verifyWebhookSignature(rawBody, 'ab')).toBe(false);
    });

    it('rejects a non-hex signature without throwing', () => {
      const rawBody = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION' });
      expect(() =>
        service.verifyWebhookSignature(rawBody, 'not-hex-at-all-$$$'),
      ).not.toThrow();
      expect(service.verifyWebhookSignature(rawBody, 'not-hex-at-all-$$$')).toBe(
        false,
      );
    });
  });

  describe('verifyWebhookSignature in stub mode (no Monnify credentials configured)', () => {
    it('always accepts, regardless of signature', async () => {
      const service = await createMonnifyService({
        MONNIFY_API_KEY: '',
        MONNIFY_SECRET_KEY: '',
      });

      expect(service.verifyWebhookSignature('any-body', 'any-signature')).toBe(
        true,
      );
      expect(service.isStubMode()).toBe(true);
    });
  });

  describe('isStubMode', () => {
    it('is false when real credentials are configured', async () => {
      const service = await createMonnifyService();
      expect(service.isStubMode()).toBe(false);
    });
  });

  describe('verifyTransaction', () => {
    const reference = 'payment-1-1700000000000';
    const transaction = {
      paymentStatus: 'PAID',
      amountPaid: 5000,
      paymentReference: reference,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (axios.post as jest.Mock).mockResolvedValue({
        data: { responseBody: { accessToken: 'monnify-access-token' } },
      });
    });

    it('queries Monnify by our payment reference', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { responseBody: transaction } });
      const service = await createMonnifyService();

      const result = await service.verifyTransaction(reference);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect((axios.get as jest.Mock).mock.calls[0][0]).toMatch(
        /\/api\/v2\/merchant\/transactions\/query$/,
      );
      expect((axios.get as jest.Mock).mock.calls[0][1].params).toEqual({
        paymentReference: reference,
      });
      expect(result).toMatchObject({ status: 'PAID', amount: 5000, reference });
    });

    it('falls back to the transaction-reference endpoint when the query fails', async () => {
      (axios.get as jest.Mock)
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce({ data: { responseBody: transaction } });
      const service = await createMonnifyService();

      const result = await service.verifyTransaction(reference);

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect((axios.get as jest.Mock).mock.calls[1][0]).toMatch(
        new RegExp(`/api/v2/transactions/${reference}$`),
      );
      expect(result.status).toBe('PAID');
    });

    it('fails when neither endpoint answers', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('down'));
      const service = await createMonnifyService();

      await expect(service.verifyTransaction(reference)).rejects.toThrow('down');
    });
  });
});
