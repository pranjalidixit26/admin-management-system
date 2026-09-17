import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Webhook route needs the exact raw bytes to verify Razorpay's signature.
  // Register raw parser ONLY for this path, before the general json parser.
  app.use('/payments/webhook', express.raw({ type: '*/*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.enableCors({
    origin: 'https://admin-management-system-psi.vercel.app',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();