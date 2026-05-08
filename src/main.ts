import { NestFactory } from '@nestjs/core'
import { ValidationPipe, BadRequestException } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { AppLogger } from '@shared/logger'

async function bootstrap() {
  const logger = new AppLogger()
  logger.setContext('Bootstrap')

  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  const config = app.get(ConfigService)
  const port = config.get<number>('app.app.port') ?? 3000
  const prefix = config.get<string>('app.app.prefix') ?? 'api/v1'
  const corsOrigins = config.get<string>('app.cors.origins') ?? 'http://localhost:5173'

  app.use(helmet())

  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Finance Backend API')
    .setDescription('Personal finance application API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup(`${prefix}/docs`, app, document)

  await app.listen(port)
  logger.log(`Application running on http://localhost:${port}/${prefix}`)
  logger.log(`Swagger docs at http://localhost:${port}/${prefix}/docs`)
}

void bootstrap()
