import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  initiate(
    @CurrentUser() user: { id: string },
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiatePayment(user.id, dto);
  }

  @Get('status/:applicationId')
  getStatus(
    @CurrentUser() user: { id: string },
    @Param('applicationId') applicationId: string,
  ) {
    return this.paymentsService.getPaymentStatus(applicationId, user.id);
  }
}

@Controller('payments')
export class PaymentsWebhookController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('webhook')
  handleWebhook(
    @Headers('monnify-signature') signature: string,
    @Req() req: Request,
  ) {
    const rawBody = JSON.stringify(req.body);
    return this.paymentsService.handleWebhook(
      rawBody,
      signature || 'stub-signature',
    );
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('payments')
export class PaymentsStubController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('simulate/:paymentId')
  @HttpCode(HttpStatus.OK)
  simulate(@Param('paymentId') paymentId: string) {
    return this.paymentsService.simulateSuccessfulPayment(paymentId);
  }
}
