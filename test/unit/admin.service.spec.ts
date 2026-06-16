import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { NotFoundException } from '@nestjs/common'
import { AdminService } from '../../src/application/admin/use-cases/admin.service'
import { UserRepository } from '../../src/domain/repositories/user.repository'

const user = {
  id: 'u1',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'García',
  alias: 'ana',
  role: 'USER',
  status: 'active',
  createdAt: new Date(),
}

describe('AdminService', () => {
  let service: AdminService
  let userRepo: Partial<UserRepository>
  let emitter: { emit: jest.Mock }

  beforeEach(async () => {
    userRepo = {
      findAll: jest.fn().mockResolvedValue([user]),
      findById: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockImplementation((_id, d) => Promise.resolve({ ...user, ...d })),
      softDelete: jest.fn().mockResolvedValue({ ...user, status: 'deleted' }),
    }
    emitter = { emit: jest.fn() }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UserRepository, useValue: userRepo },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile()
    service = module.get(AdminService)
  })

  it('lists users in a paginated envelope', async () => {
    const res = await service.listUsers({ page: 1, limit: 10 })
    expect(res.total).toBe(1)
    expect(res.data[0]).not.toHaveProperty('passwordHash')
  })

  it('throws NotFound updating role of a missing user', async () => {
    ;(userRepo.findById as jest.Mock).mockResolvedValueOnce(null)
    await expect(service.updateRole('nope', 'ADMIN')).rejects.toThrow(NotFoundException)
  })

  it('emits account.blocked when status becomes blocked', async () => {
    await service.updateStatus('u1', 'blocked')
    expect(emitter.emit).toHaveBeenCalledWith('account.blocked', { recipientUserId: 'u1' })
  })

  it('soft-deletes when status becomes deleted', async () => {
    await service.updateStatus('u1', 'deleted')
    expect(userRepo.softDelete).toHaveBeenCalledWith('u1')
  })
})
