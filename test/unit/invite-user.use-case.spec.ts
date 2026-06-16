import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as argon2 from 'argon2'
import { InviteUserUseCase } from '../../src/application/admin/use-cases/invite-user.use-case'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { MailService } from '../../src/infrastructure/mail/mail.service'
import { DuplicateEntityException } from '../../src/domain/exceptions'

jest.mock('argon2')

const dto = { email: 'new@example.com', firstName: 'Nuevo', lastName: 'User', alias: 'nuevo' }

describe('InviteUserUseCase', () => {
  let useCase: InviteUserUseCase
  let userRepo: Partial<UserRepository>
  let mail: { sendInvitation: jest.Mock }
  let emitter: { emit: jest.Mock }

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findByAlias: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: 'u9' })),
    }
    mail = { sendInvitation: jest.fn().mockResolvedValue(undefined) }
    emitter = { emit: jest.fn() }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteUserUseCase,
        { provide: UserRepository, useValue: userRepo },
        { provide: MailService, useValue: mail },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile()
    useCase = module.get(InviteUserUseCase)
    ;(argon2.hash as jest.Mock).mockResolvedValue('hashed')
  })

  it('rejects a duplicate email', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce({ id: 'x' })
    await expect(useCase.execute('admin', dto)).rejects.toThrow(DuplicateEntityException)
  })

  it('creates an invited user, emails them and emits account.invited', async () => {
    const created = await useCase.execute('admin', dto)
    const data = (userRepo.create as jest.Mock).mock.calls[0][0]
    expect(data.mustChangePassword).toBe(true)
    expect(data.invitedBy).toBe('admin')
    expect(mail.sendInvitation).toHaveBeenCalled()
    expect(emitter.emit).toHaveBeenCalledWith('account.invited', { recipientUserId: 'u9' })
    expect(created.id).toBe('u9')
  })
})
