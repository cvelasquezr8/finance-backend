import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import configuration from '@shared/config/configuration'
import { PrismaModule } from '@infrastructure/database'
import { I18nModule } from '@shared/i18n'
import { AppLogger } from '@shared/logger'
import { AuthModule } from '@interface/http/auth/auth.module'
import { TransactionModule } from '@interface/http/transaction/transaction.module'
import { BalanceModule } from '@interface/http/balance/balance.module'
import { CardModule } from '@interface/http/card/card.module'
import { EventModule } from '@interface/http/event/event.module'
import { AdminModule } from '@interface/http/admin/admin.module'
import { FilesModule } from '@interface/http/files/files.module'
import { GlobalExceptionFilter } from '@interface/filters/global-exception.filter'
import { LoggingInterceptor } from '@interface/interceptors/logging.interceptor'
import { IdempotencyInterceptor } from '@interface/interceptors/idempotency.interceptor'
import { JwtAuthGuard } from '@interface/guards/jwt-auth.guard'
import { RolesGuard } from '@interface/guards/roles.guard'
import { LangMiddleware } from '@interface/middlewares/lang.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    I18nModule,
    PrismaModule,
    AuthModule,
    TransactionModule,
    BalanceModule,
    CardModule,
    EventModule,
    AdminModule,
    FilesModule,
  ],
  providers: [
    AppLogger,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LangMiddleware).forRoutes('*')
  }
}
