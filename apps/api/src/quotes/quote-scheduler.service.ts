import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class QuoteSchedulerService {
  private readonly logger = new Logger(QuoteSchedulerService.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async notifyAdminsOfPendingQuotes() {
    const now = new Date()

    const quotes = await this.prisma.quote.findMany({
      where: {
        status: { in: ['pending_review', 'countered_by_customer'] },
      },
      include: {
        product: { select: { name: true } },
      },
    })

    if (quotes.length === 0) return

    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    })

    if (admins.length === 0) return

    for (const quote of quotes) {
      const createdAt = new Date(quote.createdAt).getTime()
      const deadlineMs = createdAt + 3 * 24 * 60 * 60 * 1000
      const remainingMs = deadlineMs - now.getTime()

      if (remainingMs <= 0) continue

      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
      const remainingDays = Math.floor(remainingHours / 24)

      const shouldNotify =
        (remainingHours <= 48 && remainingHours > 47) ||
        (remainingHours <= 24 && remainingHours > 23) ||
        (remainingHours <= 2 && remainingHours > 1)

      if (!shouldNotify) continue

      const timeLabel =
        remainingDays >= 1
          ? `${remainingDays} day${remainingDays > 1 ? 's' : ''}`
          : `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`

      const message = `Quote for ${quote.product.name} has ${timeLabel} left for response. Status: ${quote.status.replace(/_/g, ' ')}.`

      this.logger.log(`[Scheduler] Notifying admins: ${message}`)

      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          message,
          type: 'quote_deadline',
          referenceType: 'quote',
          referenceId: quote.id,
        })),
        skipDuplicates: true,
      })
    }

    this.logger.log(`[Scheduler] Quote deadline check complete — ${quotes.length} quotes checked`)
  }
}
