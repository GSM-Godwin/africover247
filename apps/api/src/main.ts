import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
    new SanitizePipe(),
  );

  app.useGlobalInterceptors(new SecurityHeadersInterceptor());

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.WEB_URL || 'http://localhost:3000',
        process.env.ADMIN_URL || 'http://localhost:3002',
      ];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} is not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`AfriCover247 API is running on: http://localhost:${port}`);
}

bootstrap();
