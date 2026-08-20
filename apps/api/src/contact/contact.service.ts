import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { CreateContactDto } from './dto/create-contact.dto'

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name)

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // --- Submit contact message ---
  async create(dto: CreateContactDto) {
    const contact = await this.prisma.contactMessage.create({ data: dto })

    await this.emailService.sendEmail({
      to: 'info@afriglobal.com.ng',
      subject: `New Contact Message — ${dto.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #15679b; padding: 24px;">
            <h2 style="color: white; margin: 0;">New Contact Message</h2>
            <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0;">AfriCover247 Contact Form</p>
          </div>
          <div style="padding: 24px; background: white;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #5C6478; font-size: 13px; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #1a1a2e;">${dto.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #5C6478; font-size: 13px;">Email</td><td style="padding: 8px 0; font-weight: 600; color: #1a1a2e;"><a href="mailto:${dto.email}">${dto.email}</a></td></tr>
              ${dto.phone ? `<tr><td style="padding: 8px 0; color: #5C6478; font-size: 13px;">Phone</td><td style="padding: 8px 0; font-weight: 600; color: #1a1a2e;">${dto.phone}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #5C6478; font-size: 13px;">Subject</td><td style="padding: 8px 0; font-weight: 600; color: #1a1a2e;">${dto.subject}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #F0F4F8; border-radius: 8px;">
              <p style="margin: 0; color: #5C6478; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
              <p style="margin: 8px 0 0; color: #1a1a2e; line-height: 1.6;">${dto.message}</p>
            </div>
            <p style="margin-top: 16px; color: #5C6478; font-size: 12px;">
              Received: ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT
            </p>
          </div>
          <div style="background: #F0F4F8; padding: 16px; text-align: center;">
            <p style="color: #5C6478; font-size: 12px; margin: 0;">
              AfriCover247 · Powered by AfriGlobal Insurance Brokers Limited
            </p>
          </div>
        </div>
      `,
    })

    this.logger.log(`Contact message from ${dto.email}: ${dto.subject}`)
    return { received: true, id: contact.id }
  }

  // --- Get all messages (admin) ---
  async findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  // --- Mark as read ---
  async markRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    })
  }

  async replyToMessage(id: string, replyMessage: string, adminName: string) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } })
    if (!message) throw new NotFoundException('Message not found')

    await this.emailService.sendEmail({
      to: message.email,
      subject: `Re: ${message.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #15679b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AfriCover247</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">AfriGlobal Insurance Brokers Limited</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #5C6478; font-size: 13px; margin-bottom: 24px;">
              Re: ${message.subject}
            </p>
            <p style="color: #0d1b2e; font-size: 15px; margin-bottom: 8px;">Dear ${message.name},</p>
            <div style="background: #F7F8FA; border-left: 4px solid #15679b; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #0d1b2e; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${replyMessage}</p>
            </div>
            <p style="color: #5C6478; font-size: 13px; margin-top: 24px;">
              Warm regards,<br/>
              <strong style="color: #0d1b2e;">${adminName}</strong><br/>
              AfriGlobal Insurance Brokers Limited
            </p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
            <p style="color: #5C6478; font-size: 12px;">
              This is a reply to your enquiry sent on ${new Date(message.createdAt).toLocaleDateString('en-NG')}.
              If you need further assistance, contact us at 
              <a href="mailto:info@afriglobal.com.ng" style="color: #15679b;">info@afriglobal.com.ng</a>
              or call 08101315330.
            </p>
          </div>
          <div style="background: #F0F4F8; padding: 16px; text-align: center;">
            <p style="color: #5C6478; font-size: 12px; margin: 0;">
              141c Oshodi/Gbagada Expressway, Anthony, Lagos · 08101315330 · info@afriglobal.com.ng
            </p>
          </div>
        </div>
      `,
    })

    await this.prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    })

    return { success: true }
  }
}
