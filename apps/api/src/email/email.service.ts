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
}
