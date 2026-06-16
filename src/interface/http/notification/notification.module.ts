import { Module } from '@nestjs/common'
import { NotificationController } from './notification.controller'
import { NotificationService } from '@application/notifications/notification.service'
import { NotificationScheduler } from '@application/notifications/notification.scheduler'
import { UserRepository } from '@domain/repositories/user.repository'
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository'
import { NotificationRepository } from '@domain/repositories/notification.repository'
import { PrismaNotificationRepository } from '@infrastructure/repositories/prisma-notification.repository'

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationScheduler,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: NotificationRepository, useClass: PrismaNotificationRepository },
  ],
})
export class NotificationModule {}
