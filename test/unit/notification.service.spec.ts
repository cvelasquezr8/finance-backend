import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { NotificationService } from '../../src/application/notifications/notification.service'
import { NotificationRepository } from '../../src/domain/repositories/notification.repository'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { NotificationEntity } from '../../src/domain/entities/notification.entity'

const notif: NotificationEntity = {
  id: 'n1',
  userId: 'u1',
  type: 'event_invitation',
  title: 'Invitación',
  message: 'msg',
  relatedId: 'e1',
  read: false,
  readAt: null,
  createdAt: new Date(),
}

describe('NotificationService', () => {
  let service: NotificationService
  let repo: Partial<NotificationRepository>
  let userRepo: Partial<UserRepository>

  beforeEach(async () => {
    repo = {
      findByUserId: jest.fn().mockResolvedValue([notif]),
      findByIdForUser: jest.fn().mockResolvedValue(notif),
      countUnread: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(notif),
      markRead: jest.fn().mockResolvedValue(undefined),
      markAllRead: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    }
    userRepo = { findById: jest.fn().mockResolvedValue({ id: 'u1', language: 'en' }) }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: repo },
        { provide: UserRepository, useValue: userRepo },
      ],
    }).compile()
    service = module.get(NotificationService)
  })

  it('lists notifications with unreadCount', async () => {
    const res = await service.list('u1')
    expect(res.data).toHaveLength(1)
    expect(res.unreadCount).toBe(1)
  })

  it('throws NotFound marking a notification not owned by the user', async () => {
    ;(repo.findByIdForUser as jest.Mock).mockResolvedValueOnce(null)
    await expect(service.markRead('u1', 'x')).rejects.toThrow(NotFoundException)
  })

  it('marks all as read', async () => {
    await service.markAllRead('u1')
    expect(repo.markAllRead).toHaveBeenCalledWith('u1')
  })

  it('account_invited listener persists a localized notification', async () => {
    await service.onAccountInvited({ recipientUserId: 'u1' })
    const arg = (repo.create as jest.Mock).mock.calls[0][0]
    expect(arg.type).toBe('account_invited')
    expect(arg.userId).toBe('u1')
    expect(arg.title).toMatch(/Welcome/i) // language 'en'
  })
})
