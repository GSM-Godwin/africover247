import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as postmark from 'postmark'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly client: postmark.ServerClient | null = null
  private readonly fromEmail: string
  private readonly isStub: boolean

  constructor(private configService: ConfigService) {
    const apiToken = this.configService.get<string>('POSTMARK_API_TOKEN') || ''
    this.fromEmail =
      this.configService.get<string>('POSTMARK_FROM_EMAIL') ||
      'noreply@africover247.com'

    this.isStub = !apiToken || apiToken === 'placeholder'

    if (this.isStub) {
      this.logger.log('[STUB] Postmark not configured — emails will be logged only')
    } else {
      this.client = new postmark.ServerClient(apiToken)
      this.logger.log('Postmark configured')
    }
  }

  // --- Send email ---
  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] Email to ${options.to}: ${options.subject}`)
      return
    }

    try {
      await this.client!.sendEmail({
        From: options.from || this.fromEmail,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.html.replace(/<[^>]*>/g, ''),
        MessageStream: 'outbound',
      })
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`)
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}:`, err)
    }
  }

  // --- Send OTP email ---
  async sendOtpEmail(email: string, otp: string, firstName: string): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] OTP for ${email}: ${otp}`)
      return
    }

    await this.sendEmail({
      to: email,
      subject: 'Your AfriCover247 verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #15679b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AfriCover247</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">AfriGlobal Insurance Brokers</p>
          </div>
          <div style="padding: 32px;">
            <p>Dear ${firstName},</p>
            <p>Your verification code is:</p>
            <div style="background: #F0F4F8; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #15679b;">${otp}</span>
            </div>
            <p style="color: #5C6478; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>
          <div style="background: #F0F4F8; padding: 16px; text-align: center;">
            <p style="color: #5C6478; font-size: 12px; margin: 0;">
              Powered by AfriGlobal Insurance Brokers Limited · Secured by Monnify
            </p>
          </div>
        </div>
      `,
    })
  }

  // --- Send policy issued email ---
  async sendPolicyIssuedEmail(
    email: string,
    firstName: string,
    policyNumber: string,
    productName: string,
    pdfUrl: string | null
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Your policy is ready — ${policyNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #15679b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">AfriCover247</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">AfriGlobal Insurance Brokers</p>
          </div>
          <div style="padding: 32px;">
            <p>Dear ${firstName},</p>
            <p>Your insurance policy has been issued successfully.</p>
            <div style="background: #E8F5F0; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; font-size: 12px; color: #5C6478; text-transform: uppercase; letter-spacing: 1px;">Policy Number</p>
              <p style="margin: 4px 0 0; font-size: 24px; font-weight: 800; color: #15679b; font-family: monospace;">${policyNumber}</p>
              <p style="margin: 8px 0 0; color: #5C6478;">${productName}</p>
            </div>
            ${pdfUrl ? `<p><a href="${pdfUrl}" style="background: #F68B1E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700;">Download Policy Certificate</a></p>` : ''}
            <p style="color: #5C6478; font-size: 14px;">You can also access your policy anytime from your AfriCover247 dashboard.</p>
          </div>
          <div style="background: #F0F4F8; padding: 16px; text-align: center;">
            <p style="color: #5C6478; font-size: 12px; margin: 0;">
              Powered by AfriGlobal Insurance Brokers Limited
            </p>
          </div>
        </div>
      `,
    })
  }

  async sendQuoteStatusEmail(
    email: string,
    firstName: string,
    productName: string,
    status: string,
    quoteId: string,
    adminMessage?: string,
    amount?: string,
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      quote_sent: 'Quote Ready',
      countered_by_admin: 'Counter Offer Received',
      accepted: 'Quote Accepted',
      rejected: 'Quote Declined',
      countered_by_customer: 'Your Counter Offer Sent',
    };
    const label = statusLabels[status] || status.replace(/_/g, ' ');
    const dashboardUrl = `https://africover247-web.vercel.app/quotes/${quoteId}`;

    await this.sendEmail({
      to: email,
      subject: `Quote update: ${label} — ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #15679b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AfriCover247</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">AfriGlobal Insurance Brokers</p>
          </div>
          <div style="padding: 32px;">
            <p>Dear ${firstName},</p>
            <p>There's an update on your quote for <strong>${productName}</strong>.</p>
            <div style="background: #EBF4FA; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; font-size: 12px; color: #5C6478; text-transform: uppercase; letter-spacing: 1px;">Status</p>
              <p style="margin: 8px 0 0; font-size: 20px; font-weight: 800; color: #15679b;">${label}</p>
              ${amount ? `<p style="margin: 8px 0 0; font-size: 16px; color: #F68B1E; font-weight: 700;">₦${parseFloat(amount).toLocaleString('en-NG')}/year</p>` : ''}
            </div>
            ${adminMessage ? `<p style="background: #F7F8FA; border-left: 4px solid #15679b; padding: 12px 16px; border-radius: 4px; color: #5C6478;">${adminMessage}</p>` : ''}
            <a href="${dashboardUrl}" style="display: inline-block; background: #F68B1E; color: #15679b; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 800; margin-top: 8px;">View Quote</a>
          </div>
          <div style="background: #F0F4F8; padding: 16px; text-align: center;">
            <p style="color: #5C6478; font-size: 12px; margin: 0;">Powered by AfriGlobal Insurance Brokers Limited</p>
          </div>
        </div>
      `,
    });
  }

  async sendClaimStatusEmail(
    email: string,
    firstName: string,
    claimReference: string,
    productName: string,
    status: string,
    note?: string,
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      submitted: 'Claim Submitted',
      in_review: 'Claim Under Review',
      approved: 'Claim Approved',
      rejected: 'Claim Rejected',
      paid: 'Claim Paid',
    };
    const label = statusLabels[status] || status.replace(/_/g, ' ');
    const dashboardUrl = `https://africover247-web.vercel.app/claims`;

    await this.sendEmail({
      to: email,
      subject: `Claim update: ${label} — ${claimReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #15679b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AfriCover247</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">AfriGlobal Insurance Brokers</p>
          </div>
          <div style="padding: 32px;">
            <p>Dear ${firstName},</p>
            <p>There's an update on your claim <strong>${claimReference}</strong> for ${productName}.</p>
            <div style="background: #EBF4FA; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; font-size: 12px; color: #5C6478; text-transform: uppercase; letter-spacing: 1px;">Status</p>
              <p style="margin: 8px 0 0; font-size: 20px; font-weight: 800; color: #15679b;">${label}</p>
            </div>
            ${note ? `<p style="background: #F7F8FA; border-left: 4px solid #15679b; padding: 12px 16px; border-radius: 4px; color: #5C6478;">${note}</p>` : ''}
            <a href="${dashboardUrl}" style="display: inline-block; background: #F68B1E; color: #15679b; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 800; margin-top: 8px;">View Claim</a>
          </div>
          <div style="background: #F0F4F8; padding: 16px; text-align: center;">
            <p style="color: #5C6478; font-size: 12px; margin: 0;">Powered by AfriGlobal Insurance Brokers Limited</p>
          </div>
        </div>
      `,
    });
  }

  async sendPolicyExpiryReminderEmail(
    email: string,
    firstName: string,
    policyNumber: string,
    productName: string,
    expiryDate: Date,
    daysLeft: number,
  ): Promise<void> {
    const dashboardUrl = `https://africover247-web.vercel.app/policies`;
    const formattedDate = expiryDate.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await this.sendEmail({
      to: email,
      subject: `Your policy expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — ${policyNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #15679b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AfriCover247</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">AfriGlobal Insurance Brokers</p>
          </div>
          <div style="padding: 32px;">
            <p>Dear ${firstName},</p>
            <p>Your insurance policy is expiring soon. Please renew to stay protected.</p>
            <div style="background: ${daysLeft <= 7 ? '#FDEAEA' : '#EBF4FA'}; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; font-size: 12px; color: #5C6478; text-transform: uppercase; letter-spacing: 1px;">Policy</p>
              <p style="margin: 8px 0 0; font-size: 18px; font-weight: 800; color: #15679b;">${productName}</p>
              <p style="margin: 4px 0 0; font-family: monospace; font-size: 14px; color: #5C6478;">${policyNumber}</p>
              <p style="margin: 12px 0 0; font-size: 16px; font-weight: 700; color: ${daysLeft <= 7 ? '#D65A45' : '#F68B1E'};">
                Expires ${formattedDate} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining)
              </p>
            </div>
            <a href="${dashboardUrl}" style="display: inline-block; background: #F68B1E; color: #15679b; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 800; margin-top: 8px;">Renew Policy</a>
          </div>
          <div style="background: #F0F4F8; padding: 16px; text-align: center;">
            <p style="color: #5C6478; font-size: 12px; margin: 0;">Powered by AfriGlobal Insurance Brokers Limited</p>
          </div>
        </div>
      `,
    });
  }
}
