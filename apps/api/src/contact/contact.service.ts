import { Injectable, Logger } from '@nestjs/common'
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
}
