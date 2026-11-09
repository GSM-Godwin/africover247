import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AppleTokenService } from './apple-token.service';
import { StepUpService } from './step-up.service';
import { StepUpTokenService } from './step-up-token.service';
import { PasswordAttemptLimiterService } from './password-attempt-limiter.service';
import { PaymentStepUpGuard } from './guards/payment-step-up.guard';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PremiumModule } from '../premium/premium.module';

@Module({
  imports: [
    PrismaModule,
    PremiumModule,
    EmailModule,
    SmsModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'JWT_EXPIRES_IN',
          ) as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    AppleTokenService,
    StepUpService,
    StepUpTokenService,
    PasswordAttemptLimiterService,
    PaymentStepUpGuard,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, AppleTokenService, StepUpTokenService, PaymentStepUpGuard],
})
export class AuthModule {}
