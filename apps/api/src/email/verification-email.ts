export const VERIFICATION_EMAIL_SUBJECT = 'Your AfriCover247 verification code';
export const SUPPORT_EMAIL = 'info@afriglobal.com.ng';
export const SUPPORT_PHONE = '08101315330 / 09063675032';
export const COMPANY_LINE = 'AfriGlobal Insurance Brokers Limited · NAICOM licensed';

export type VerificationPurpose = 'payment_step_up' | 'email_verification' | 'password_reset';

export interface VerificationEmailModel {
  firstName: string;
  code: string;
  purpose: VerificationPurpose;
  requestedAt: Date;
  expiresInMinutes: number;
  device?: string | null;
  payment?: { productName: string; amount: number } | null;
}

export interface VerificationEmailContent {
  subject: string;
  purposeLine: string;
  paymentLine: string | null;
  requestedAtLine: string;
  deviceLine: string | null;
  html: string;
  text: string;
}

const PURPOSE_LINES: Record<VerificationPurpose, string> = {
  payment_step_up: 'You asked for a code to confirm a payment on AfriCover247.',
  email_verification: 'You asked for a code to verify your email address on AfriCover247.',
  password_reset: 'You asked for a code to reset your AfriCover247 password.',
};

const NOT_YOU_LINES: Record<VerificationPurpose, string> = {
  payment_step_up: `If you did not request this code, contact us at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE} and change your password.`,
  email_verification: `If you did not create an AfriCover247 account, contact us at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE}.`,
  password_reset: `If you did not request this code, contact us at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE} and change your password.`,
};

const DO_NOT_SHARE_LINE = 'Do not share this code with anyone, including AfriCover247 staff.';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatWestAfricaTime(date: Date): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${formatted} WAT`;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

const BROWSERS: Array<[RegExp, string]> = [
  [/Edg(e|A|iOS)?\//, 'Microsoft Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const OPERATING_SYSTEMS: Array<[RegExp, string]> = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'Mac'],
  [/Linux/, 'Linux'],
];

export function describeDevice(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  if (/okhttp/i.test(userAgent)) return 'AfriCover247 app on Android';
  if (/CFNetwork|Darwin/i.test(userAgent) && !/Mozilla/.test(userAgent)) {
    return 'AfriCover247 app on iPhone';
  }
  const os = OPERATING_SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? null;
}

export function buildVerificationEmail(model: VerificationEmailModel): VerificationEmailContent {
  const purposeLine = PURPOSE_LINES[model.purpose];
  const paymentLine =
    model.purpose === 'payment_step_up' && model.payment
      ? `Payment: ${model.payment.productName}, ${formatNaira(model.payment.amount)}`
      : null;
  const requestedAtLine = `Requested: ${formatWestAfricaTime(model.requestedAt)}`;
  const deviceLine = model.device ? `Device: ${model.device}` : null;
  const expiryLine = `This code expires in ${model.expiresInMinutes} minutes.`;
  const notYouLine = NOT_YOU_LINES[model.purpose];
  const detailLines = [paymentLine, requestedAtLine, deviceLine].filter(
    (line): line is string => Boolean(line),
  );

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #101A34;">
      <div style="background: #15679b; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">AfriCover247</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">AfriGlobal Insurance Brokers</p>
      </div>
      <div style="padding: 32px;">
        <p>Dear ${escapeHtml(model.firstName || 'Customer')},</p>
        <p>${escapeHtml(purposeLine)}</p>
        <p>Your verification code is:</p>
        <div style="background: #F0F4F8; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #15679b;">${escapeHtml(model.code)}</span>
        </div>
        <p style="font-size: 14px; margin: 0 0 16px;">${escapeHtml(expiryLine)}</p>
        <table role="presentation" style="font-size: 14px; color: #5C6478; margin: 0 0 16px;">
          ${detailLines.map((line) => `<tr><td style="padding: 2px 0;">${escapeHtml(line)}</td></tr>`).join('')}
        </table>
        <p style="font-size: 14px; font-weight: bold;">${escapeHtml(DO_NOT_SHARE_LINE)}</p>
        <p style="font-size: 14px; color: #5C6478;">${escapeHtml(notYouLine)}</p>
      </div>
      <div style="background: #F0F4F8; padding: 16px; text-align: center;">
        <p style="color: #5C6478; font-size: 12px; margin: 0;">${escapeHtml(COMPANY_LINE)}</p>
      </div>
    </div>
  `;

  const text = [
    `Dear ${model.firstName || 'Customer'},`,
    '',
    purposeLine,
    '',
    `Your verification code is: ${model.code}`,
    expiryLine,
    '',
    ...detailLines,
    '',
    DO_NOT_SHARE_LINE,
    notYouLine,
    '',
    COMPANY_LINE,
  ].join('\n');

  return {
    subject: VERIFICATION_EMAIL_SUBJECT,
    purposeLine,
    paymentLine,
    requestedAtLine,
    deviceLine,
    html,
    text,
  };
}
