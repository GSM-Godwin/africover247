import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RespondQuoteDto } from './dto/respond-quote.dto';
import { CounterQuoteDto } from './dto/counter-quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createQuote(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.createQuote(user.id, dto);
  }

  @Get('my')
  getMyQuotes(@CurrentUser() user: { id: string }) {
    return this.quotesService.getMyQuotes(user.id);
  }

  @Get(':id')
  getQuote(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.quotesService.getQuote(id, user.id, user.role);
  }

  @Post(':id/accept')
  acceptQuote(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.quotesService.acceptQuote(id, user.id);
  }

  @Post(':id/reject')
  rejectQuote(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.quotesService.rejectQuote(id, user.id);
  }

  @Post(':id/counter')
  customerCounter(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CounterQuoteDto,
  ) {
    return this.quotesService.customerCounterQuote(id, user.id, dto);
  }
}

@Controller('admin/quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminQuotesController {
  constructor(private quotesService: QuotesService) {}

  @Get()
  getAllQuotes(@Query('status') status?: string) {
    return this.quotesService.adminGetAllQuotes({ status });
  }

  @Get(':id')
  getQuote(
    @Param('id') id: string,
    @CurrentUser() admin: { id: string },
  ) {
    return this.quotesService.getQuote(id, admin.id, 'admin');
  }

  @Post(':id/respond')
  respond(
    @Param('id') id: string,
    @CurrentUser() admin: { id: string },
    @Body() dto: RespondQuoteDto,
  ) {
    return this.quotesService.adminRespondToQuote(id, dto, admin.id);
  }

  @Post(':id/counter')
  counter(
    @Param('id') id: string,
    @CurrentUser() admin: { id: string },
    @Body() dto: CounterQuoteDto,
  ) {
    return this.quotesService.adminCounterQuote(id, admin.id, dto);
  }

  @Post(':id/accept-counter')
  acceptCounter(
    @Param('id') id: string,
    @CurrentUser() admin: { id: string },
  ) {
    return this.quotesService.adminAcceptCounter(id, admin.id);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() admin: { id: string },
    @Body('reason') reason?: string,
  ) {
    return this.quotesService.adminRejectQuote(id, admin.id, reason);
  }
}
