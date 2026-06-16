import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserRepository } from '@domain/repositories/user.repository'
import { NOTIFICATION_EVENTS, MonthlySummaryEvent } from './notification.events'

@Injectable()
export class NotificationScheduler {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly emitter: EventEmitter2
  ) {}

  /** 09:00 on the 1st of every month: notify opted-in active users. */
  @Cron('0 9 1 * *')
  async emitMonthlySummaries(): Promise<void> {
    const now = new Date()
    const users = await this.userRepo.findAll()
    for (const user of users) {
      if (user.status !== 'active' || !user.monthlyNotifications) continue
      this.emitter.emit(NOTIFICATION_EVENTS.monthlySummary, {
        recipientUserId: user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      } satisfies MonthlySummaryEvent)
    }
  }
}
