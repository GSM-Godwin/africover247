import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { SanitizePipe } from './common/pipes/sanitize.pipe'
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(helmet({
    contentSecurityPolicy: false,
  }))

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
    new SanitizePipe(),
  )

  app.useGlobalInterceptors(new SecurityHeadersInterceptor())

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'],
  })

  // --- Swagger API documentation ---
  const config = new DocumentBuilder()
    .setTitle('AfriCover247 API')
    .setDescription(
      'REST API for AfriCover247 — Digital Insurance Platform by AfriGlobal Insurance Brokers Limited. ' +
      'Provides endpoints for user authentication, insurance applications, quotes, policies, claims, payments, and admin operations.'
    )
    .setVersion('1.0.0')
    .setContact('AfriGlobal Insurance Brokers Limited', 'https://africover247-web.vercel.app', 'info@afriglobal.com.ng')
    .setLicense('Proprietary', '')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token. Obtain one from POST /auth/login',
        in: 'header',
      },
      'JWT',
    )
    .addTag('Auth', 'User registration, login, OTP, Google/Apple sign-in')
    .addTag('Users', 'User profile and account management')
    .addTag('Products', 'Insurance product catalogue and search')
    .addTag('Applications', 'Insurance application wizard and KYC')
    .addTag('Quotes', 'Quote requests and admin responses')
    .addTag('Payments', 'Payment initiation and Monnify webhooks')
    .addTag('Policies', 'Policy issuance and certificate download')
    .addTag('Claims', 'Claims submission and status tracking')
    .addTag('Support', 'Support tickets, appointments, call logs')
    .addTag('Contact', 'Contact messages and replies')
    .addTag('Notifications', 'Push and in-app notifications')
    .addTag('Admin', 'Admin operations, audit logs, dashboard stats')
    .addServer('https://africover247.onrender.com', 'Production')
    .addServer('http://localhost:3001', 'Local Development')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'AfriCover247 API Docs',
  })

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`AfriCover247 API running on: http://localhost:${port}`)
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`)
}

bootstrap()
