import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { UserProfileService } from '../../src/application/user/use-cases/user-profile.service'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { PrismaService } from '../../src/infrastructure/database'
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

const mockPrisma = {
  $transaction: jest.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
  refreshToken: {
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  user: {
    update: jest.fn().mockResolvedValue(baseUser),
  },
}

describe('UserProfileService', () => {
  let service: UserProfileService
  let repo: Partial<UserRepository>

  beforeEach(async () => {
    jest.clearAllMocks()
    repo = {
      findById: jest.fn().mockResolvedValue(baseUser),
      update: jest
        .fn()
        .mockImplementation((_id: string, data: Partial<UserEntity>) =>
          Promise.resolve({ ...baseUser, ...data })
        ),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        { provide: UserRepository, useValue: repo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get(UserProfileService)
  })

  // ─── updateProfile ─────────────────────────────────────────────────────────

  describe('updateProfile()', () => {
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

  // ─── deleteMyAccount ───────────────────────────────────────────────────────

  describe('deleteMyAccount()', () => {
    it('throws NotFound when the user does not exist', async () => {
      ;(repo.findById as jest.Mock).mockResolvedValueOnce(null)
      await expect(service.deleteMyAccount('missing')).rejects.toThrow(NotFoundException)
    })

    it('executes revocation and anonymization inside a single $transaction call', async () => {
      await service.deleteMyAccount('u1')
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    })

    it('revokes all refresh tokens for the user', async () => {
      await service.deleteMyAccount('u1')
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } })
      )
    })

    it('marks the user as deleted and anonymizes PII', async () => {
      await service.deleteMyAccount('u1')
      const updateCall = mockPrisma.user.update.mock.calls[0][0]
      expect(updateCall.where).toEqual({ id: 'u1' })
      expect(updateCall.data.status).toBe('deleted')
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date)
      // PII fields are anonymized
      expect(updateCall.data.firstName).toBe('Deleted')
      expect(updateCall.data.lastName).toBe('User')
      expect(updateCall.data.middleName).toBeNull()
      expect(updateCall.data.phone).toBeNull()
      expect(updateCall.data.avatarUrl).toBeNull()
      // Email and alias use a random suffix in the format deleted_<12chars>@deleted.invalid
      expect(updateCall.data.email).toMatch(/^deleted_[a-f0-9]{12}@deleted\.invalid$/)
      expect(updateCall.data.alias).toMatch(/^deleted_[a-f0-9]{12}$/)
      // Password is replaced with a cryptographically locked hash (argon2 format)
      expect(typeof updateCall.data.passwordHash).toBe('string')
      expect(updateCall.data.passwordHash).toMatch(/^\$argon2/)
    })

    it('uses a unique suffix per invocation (no collisions between calls)', async () => {
      await service.deleteMyAccount('u1')
      await service.deleteMyAccount('u1')
      const [call1, call2] = mockPrisma.user.update.mock.calls
      expect(call1[0].data.email).not.toBe(call2[0].data.email)
    })
  })
})
