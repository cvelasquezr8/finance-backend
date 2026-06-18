import { NestFactory } from '@nestjs/core'
import { ValidationPipe, BadRequestException } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { AppLogger } from '@shared/logger'

async function bootstrap() {
  const logger = new AppLogger()
  logger.setContext('Bootstrap')

  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  const config = app.get(ConfigService)
  const port = config.get<number>('app.app.port') ?? 3000
  const prefix = config.get<string>('app.app.prefix') ?? 'api/v1'
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3001,http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  app.use(helmet())
  app.use(cookieParser())

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-idempotency-key'],
    credentials: true,
  })

  app.setGlobalPrefix(prefix)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}))
        return new BadRequestException(messages)
      },
    })
  )

  // Swagger is only exposed in development. In production (or any other mode)
  // the docs endpoint is never mounted.
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (isDevelopment) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Finance Backend API')
      .setDescription('Personal finance application API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup(`${prefix}/docs`, app, document)
  }

  await app.listen(port)
  logger.log(`Application running on http://localhost:${port}/${prefix}`)
  if (isDevelopment) {
    logger.log(`Swagger docs at http://localhost:${port}/${prefix}/docs`)
  }
}

void bootstrap()
