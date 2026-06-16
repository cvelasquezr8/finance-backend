import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { UserProfileService } from '../../src/application/user/use-cases/user-profile.service'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { UserEntity } from '../../src/domain/entities/user.entity'

const baseUser: UserEntity = {
  id: 'u1',
  email: 'ana@example.com',
  passwordHash: 'h',
  firstName: 'Ana',
  lastName: 'García',
  middleName: null,
  secondLastName: null,
  phone: null,
  alias: 'ana',
  currency: 'MXN',
  timezone: 'America/Mexico_City',
  language: 'es',
  theme: 'dark',
  avatarUrl: null,
  monthlyNotifications: true,
  role: 'USER',
  status: 'active',
  mustChangePassword: false,
  invitedBy: null,
  invitedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdLocalTimeAt: null,
  updatedLocalTimeAt: null,
  deletedLocalTimeAt: null,
}

describe('UserProfileService', () => {
  let service: UserProfileService
  let repo: Partial<UserRepository>

  beforeEach(async () => {
    repo = {
      findById: jest.fn().mockResolvedValue(baseUser),
      update: jest
        .fn()
        .mockImplementation((_id, data) => Promise.resolve({ ...baseUser, ...data })),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserProfileService, { provide: UserRepository, useValue: repo }],
    }).compile()
    service = module.get(UserProfileService)
  })

  it('throws NotFound when the user does not exist', async () => {
    ;(repo.findById as jest.Mock).mockResolvedValueOnce(null)
    await expect(service.updateProfile('missing', { firstName: 'X' })).rejects.toThrow(
      NotFoundException
    )
  })

  it('updates and returns the public user DTO (no passwordHash)', async () => {
    const dto = await service.updateProfile('u1', { firstName: 'Anita', theme: 'light' })
    expect(repo.update).toHaveBeenCalledWith('u1', { firstName: 'Anita', theme: 'light' })
    expect(dto.firstName).toBe('Anita')
    expect(dto.theme).toBe('light')
    expect(dto).not.toHaveProperty('passwordHash')
  })
})
