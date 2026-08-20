import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { ContactService } from './contact.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'

@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto)
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.contactService.findAll()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(id)
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  markRead(@Param('id') id: string) {
    return this.contactService.markRead(id)
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async replyToMessage(
    @Param('id') id: string,
    @Body() body: { message: string },
    @CurrentUser() user: { id: string },
  ) {
    const admin = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true },
    })
    const adminName = admin
      ? `${admin.firstName} ${admin.lastName}`
      : 'AfriGlobal Support'
    return this.contactService.replyToMessage(id, body.message, adminName)
  }
}
