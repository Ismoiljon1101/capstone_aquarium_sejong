import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS — allow dashboard and mobile dev origins
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')
    : ['http://localhost:3002', 'http://localhost:3000', 'http://localhost:8081'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global input validation via class-validator DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
