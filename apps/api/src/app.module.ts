import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    PrismaModule,
    EmailModule,
    AuthModule,
    ProductsModule,
    HealthModule,
    StorageModule,
    ApplicationsModule,
    UsersModule,
    AdminModule,
    ClaimsModule,
    NotificationsModule,
    PaymentsModule,
    PoliciesModule,
  ],
})
export class AppModule {}
