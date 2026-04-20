import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const raw = process.env.CORS_ORIGIN?.trim();
  const corsOrigin =
    !raw || raw === '*'
      ? true
      : raw.split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({
    origin: corsOrigin,
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend listening on port ${port}`);
}

bootstrap();
