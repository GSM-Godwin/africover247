import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { ContactService } from './contact.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

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
}
