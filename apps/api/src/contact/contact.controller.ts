import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { ContactService } from './contact.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // --- Public: submit message ---
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto)
  }

  // --- Admin: list all messages ---
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.contactService.findAll()
  }

  // --- Admin: mark read ---
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  markRead(@Param('id') id: string) {
    return this.contactService.markRead(id)
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  replyToMessage(
    @Param('id') id: string,
    @Body() body: { message: string; adminName: string },
    @CurrentUser() _user: { id: string },
  ) {
    return this.contactService.replyToMessage(id, body.message, body.adminName)
  }
}
