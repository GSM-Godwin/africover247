import {
  failureReasonFor,
  gatewayStatusToOutcome,
  GENERIC_FAILURE_REASON,
  resolvePaymentOutcome,
  storedGatewayStatus,
} from './payment-outcome';

describe('payment outcome mapping', () => {
  describe('gatewayStatusToOutcome', () => {
    it.each([
      ['PAID', 'paid'],
      ['paid', 'paid'],
      ['USER_CANCELLED', 'cancelled'],
      ['CANCELLED', 'cancelled'],
      ['ABANDONED', 'cancelled'],
      ['FAILED', 'failed'],
      ['EXPIRED', 'failed'],
      ['REVERSED', 'failed'],
      ['PENDING', 'pending'],
      ['OVERPAID', 'pending'],
      ['PARTIALLY_PAID', 'pending'],
      ['SOMETHING_NEW', 'pending'],
      ['', 'pending'],
      [null, 'pending'],
      [undefined, 'pending'],
    ])('maps Monnify %p to %s', (status, expected) => {
      expect(gatewayStatusToOutcome(status)).toBe(expected);
    });
  });

  describe('failureReasonFor', () => {
    it('gives a fixed, safe reason for known failure statuses', () => {
      expect(failureReasonFor('EXPIRED')).toBe(
        'The payment session expired before it was completed.',
      );
      expect(failureReasonFor('FAILED')).toBe(
        'The payment was declined or could not be processed.',
      );
    });

    it('never echoes unknown gateway text', () => {
      expect(failureReasonFor('Card 5399…1234 declined: insufficient funds')).toBe(
        GENERIC_FAILURE_REASON,
      );
      expect(failureReasonFor(null)).toBe(GENERIC_FAILURE_REASON);
    });
  });

  describe('storedGatewayStatus', () => {
    it('reads paymentStatus from a stored gateway response', () => {
      expect(storedGatewayStatus({ paymentStatus: 'EXPIRED', amountPaid: 0 })).toBe('EXPIRED');
    });

    it.each([null, 'text', 42, {}])('returns null for %p', (value) => {
      expect(storedGatewayStatus(value)).toBeNull();
    });
  });

  describe('resolvePaymentOutcome', () => {
    it.each([
      [{ applicationStatus: 'issued', paymentStatus: 'pending', liveGatewayStatus: null }, 'successful'],
      [{ applicationStatus: 'paid', paymentStatus: 'pending', liveGatewayStatus: null }, 'successful'],
      [{ applicationStatus: 'pending_payment', paymentStatus: 'successful', liveGatewayStatus: null }, 'successful'],
      [{ applicationStatus: 'pending_payment', paymentStatus: 'failed', liveGatewayStatus: null }, 'failed'],
      [{ applicationStatus: 'rejected', paymentStatus: 'pending', liveGatewayStatus: null }, 'failed'],
      [{ applicationStatus: 'pending_payment', paymentStatus: 'pending', liveGatewayStatus: 'USER_CANCELLED' }, 'cancelled'],
      [{ applicationStatus: 'pending_payment', paymentStatus: 'pending', liveGatewayStatus: 'PENDING' }, 'pending'],
      [{ applicationStatus: 'pending_payment', paymentStatus: 'pending', liveGatewayStatus: 'PAID' }, 'pending'],
      [{ applicationStatus: 'pending_payment', paymentStatus: 'pending', liveGatewayStatus: null }, 'pending'],
      [{ applicationStatus: 'draft', paymentStatus: null, liveGatewayStatus: null }, 'none'],
    ] as const)('%j -> %s', (input, expected) => {
      expect(resolvePaymentOutcome(input)).toBe(expected);
    });
  });
});
