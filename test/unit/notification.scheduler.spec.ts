import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { NotificationScheduler } from '../../src/application/notifications/notification.scheduler'
import { UserRepository } from '../../src/domain/repositories/user.repository'

describe('NotificationScheduler', () => {
  let scheduler: NotificationScheduler
  let emitter: { emit: jest.Mock }

  beforeEach(async () => {
    const users = [
      { id: 'a', status: 'active', monthlyNotifications: true },
      { id: 'b', status: 'active', monthlyNotifications: false }, // opted out
      { id: 'c', status: 'blocked', monthlyNotifications: true }, // inactive
    ]
    emitter = { emit: jest.fn() }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationScheduler,
        { provide: UserRepository, useValue: { findAll: jest.fn().mockResolvedValue(users) } },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile()
    scheduler = module.get(NotificationScheduler)
  })

  it('emits monthly summaries only for active, opted-in users', async () => {
    await scheduler.emitMonthlySummaries()
    expect(emitter.emit).toHaveBeenCalledTimes(1)
    expect(emitter.emit).toHaveBeenCalledWith(
      'summary.monthly',
      expect.objectContaining({ recipientUserId: 'a' })
    )
  })
})
