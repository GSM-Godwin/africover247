import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { HealthModule } from './health/health.module';
import { ApplicationsModule } from './applications/applications.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { ClaimsModule } from './claims/claims.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PoliciesModule } from './policies/policies.module';
import { RedisModule } from './redis/redis.module';
import { KycModule } from './kyc/kyc.module';
import { SmsModule } from './sms/sms.module';
import { QuotesModule } from './quotes/quotes.module';
import { ContactModule } from './contact/contact.module';
import { FirebaseModule } from './firebase/firebase.module';
import { SearchModule } from './search/search.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    FirebaseModule,
    SearchModule,
    RedisModule,
    PrismaModule,
    EmailModule,
    AuthModule,
    ProductsModule,
    HealthModule,
    StorageModule,
    KycModule,
    SmsModule,
    ApplicationsModule,
    UsersModule,
    AdminModule,
    ClaimsModule,
    NotificationsModule,
    PaymentsModule,
    PoliciesModule,
    QuotesModule,
    ContactModule,
    SupportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
