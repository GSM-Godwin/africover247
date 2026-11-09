import {
  buildVerificationEmail,
  COMPANY_LINE,
  describeDevice,
  formatWestAfricaTime,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  VERIFICATION_EMAIL_SUBJECT,
  type VerificationEmailModel,
} from './verification-email';

const REQUESTED_AT = new Date(Date.UTC(2026, 10, 9, 13, 5, 0));
const CODE = '482913';

function buildModel(overrides: Partial<VerificationEmailModel> = {}): VerificationEmailModel {
  return {
    firstName: 'Ada',
    code: CODE,
    purpose: 'payment_step_up',
    requestedAt: REQUESTED_AT,
    expiresInMinutes: 10,
    device: 'Chrome on Windows',
    payment: { productName: 'Motor Comprehensive Insurance', amount: 125000 },
    ...overrides,
  };
}

describe('buildVerificationEmail', () => {
  it('uses the fixed subject and never puts the code in it', () => {
    const email = buildVerificationEmail(buildModel());

    expect(email.subject).toBe(VERIFICATION_EMAIL_SUBJECT);
    expect(email.subject).toBe('Your AfriCover247 verification code');
    expect(email.subject).not.toContain(CODE);
  });

  it('explains a payment step-up with the product and amount', () => {
    const email = buildVerificationEmail(buildModel());

    expect(email.purposeLine).toBe('You asked for a code to confirm a payment on AfriCover247.');
    expect(email.paymentLine).toBe('Payment: Motor Comprehensive Insurance, ₦125,000');
    expect(email.text).toContain('Payment: Motor Comprehensive Insurance, ₦125,000');
    expect(email.html).toContain('Motor Comprehensive Insurance');
  });

  it('shows kobo only when the amount has them', () => {
    const email = buildVerificationEmail(
      buildModel({ payment: { productName: 'Group Life', amount: 740.74 } }),
    );

    expect(email.paymentLine).toBe('Payment: Group Life, ₦740.74');
  });

  it('omits the payment line when the payment is not known', () => {
    const email = buildVerificationEmail(buildModel({ payment: null }));

    expect(email.paymentLine).toBeNull();
    expect(email.text).not.toContain('Payment:');
  });

  it.each(['email_verification', 'password_reset'] as const)(
    'never shows payment details for a %s code',
    (purpose) => {
      const email = buildVerificationEmail(buildModel({ purpose }));

      expect(email.paymentLine).toBeNull();
      expect(email.text).not.toContain('Motor Comprehensive Insurance');
      expect(email.html).not.toContain('Motor Comprehensive Insurance');
    },
  );

  it.each([
    ['email_verification', 'You asked for a code to verify your email address on AfriCover247.'],
    ['password_reset', 'You asked for a code to reset your AfriCover247 password.'],
  ] as const)('states the purpose for %s', (purpose, line) => {
    expect(buildVerificationEmail(buildModel({ purpose })).purposeLine).toBe(line);
  });

  it('shows the request time in West Africa Time', () => {
    const email = buildVerificationEmail(buildModel());

    expect(email.requestedAtLine).toBe('Requested: 9 November 2026 at 14:05 WAT');
  });

  it('includes the device when known and omits it otherwise', () => {
    expect(buildVerificationEmail(buildModel()).deviceLine).toBe('Device: Chrome on Windows');
    const withoutDevice = buildVerificationEmail(buildModel({ device: null }));
    expect(withoutDevice.deviceLine).toBeNull();
    expect(withoutDevice.text).not.toContain('Device:');
  });

  it('includes the expiry, the do-not-share warning, support contacts and licence line', () => {
    const { text, html } = buildVerificationEmail(buildModel());

    for (const body of [text, html]) {
      expect(body).toContain('This code expires in 10 minutes.');
      expect(body).toContain('Do not share this code with anyone, including AfriCover247 staff.');
      expect(body).toContain(SUPPORT_EMAIL);
      expect(body).toContain(SUPPORT_PHONE);
    }
    expect(text).toContain(
      `If you did not request this code, contact us at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE} and change your password.`,
    );
    expect(text).toContain(COMPANY_LINE);
    expect(COMPANY_LINE).toBe('AfriGlobal Insurance Brokers Limited · NAICOM licensed');
  });

  it('puts the code in the body', () => {
    const { text, html } = buildVerificationEmail(buildModel());

    expect(text).toContain(CODE);
    expect(html).toContain(CODE);
  });

  it('escapes user-controlled text in the HTML', () => {
    const { html } = buildVerificationEmail(
      buildModel({
        firstName: '<script>alert(1)</script>',
        payment: { productName: 'Motor & <b>Bold</b>', amount: 1 },
      }),
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Motor &amp; &lt;b&gt;Bold&lt;/b&gt;');
  });
});

describe('formatWestAfricaTime', () => {
  it('converts UTC to Africa/Lagos (UTC+1) regardless of the server time zone', () => {
    expect(formatWestAfricaTime(new Date(Date.UTC(2026, 0, 1, 23, 30)))).toBe(
      '2 January 2026 at 00:30 WAT',
    );
  });
});

describe('describeDevice', () => {
  it.each([
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      'Chrome on Windows',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0',
      'Microsoft Edge on Windows',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'Safari on iPhone',
    ],
    [
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36',
      'Samsung Internet on Android',
    ],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0; rv:131.0) Gecko/20100101 Firefox/131.0', 'Firefox on Mac'],
    ['okhttp/4.12.0', 'AfriCover247 app on Android'],
    ['AfriCover247/1 CFNetwork/1568.100.1 Darwin/24.0.0', 'AfriCover247 app on iPhone'],
  ])('describes %s', (userAgent, expected) => {
    expect(describeDevice(userAgent)).toBe(expected);
  });

  it.each([undefined, null, '', 'curl/8.4.0'])('returns null for %p', (userAgent) => {
    expect(describeDevice(userAgent)).toBeNull();
  });
});
