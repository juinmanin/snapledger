import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger (development only)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SnapLedger API')
      .setDescription('Receipt OCR Accounting Application API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('receipts', 'Receipt scanning and management')
      .addTag('transactions', 'Transaction management')
      .addTag('categories', 'Category management')
      .addTag('budgets', 'Budget management')
      .addTag('reports', 'Financial reports')
      .addTag('notifications', 'Notification management')
      .addTag('tax-invoices', 'Tax invoice management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Prisma shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Start server
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║   🚀 SnapLedger Backend Started      ║
  ║                                       ║
  ║   📍 Server: http://localhost:${port}   ║
  ║   📚 API Docs: http://localhost:${port}/api/docs
  ║   🌍 Environment: ${configService.get<string>('NODE_ENV', 'development')}
  ║                                       ║
  ╚═══════════════════════════════════════╝
  `);
}

bootstrap();
