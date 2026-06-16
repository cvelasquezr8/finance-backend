import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import * as argon2 from 'argon2'
import { LoginUseCase } from '../../src/application/auth/use-cases/login.use-case'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { PrismaService } from '../../src/infrastructure/database'
import { UserEntity } from '../../src/domain/entities/user.entity'

jest.mock('argon2')

const user: UserEntity = {
  id: 'u1',
  email: 'ana@example.com',
  passwordHash: 'hash',
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

describe('LoginUseCase', () => {
  let useCase: LoginUseCase
  let userRepo: Partial<UserRepository>
  let prisma: { refreshToken: { create: jest.Mock } }

  beforeEach(async () => {
    userRepo = { findByEmail: jest.fn().mockResolvedValue(user) }
    prisma = { refreshToken: { create: jest.fn().mockResolvedValue({}) } }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: UserRepository, useValue: userRepo },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('jwt-token') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()
    useCase = module.get(LoginUseCase)
    ;(argon2.verify as jest.Mock).mockResolvedValue(true)
  })

  it('rejects unknown email', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce(null)
    await expect(useCase.execute('x@y.com', 'p')).rejects.toThrow(UnauthorizedException)
  })

  it('rejects a non-active account', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce({ ...user, status: 'blocked' })
    await expect(useCase.execute(user.email, 'p')).rejects.toThrow(UnauthorizedException)
  })

  it('rejects an invalid password', async () => {
    ;(argon2.verify as jest.Mock).mockResolvedValueOnce(false)
    await expect(useCase.execute(user.email, 'bad')).rejects.toThrow(UnauthorizedException)
  })

  it('issues tokens, persists the refresh token and returns the user dto', async () => {
    const res = await useCase.execute(user.email, 'good')
    expect(res.token).toBe('jwt-token')
    expect(res.refreshToken).toBe('jwt-token')
    expect(res.user.email).toBe(user.email)
    expect(res.user).not.toHaveProperty('passwordHash')
    expect(prisma.refreshToken.create).toHaveBeenCalled()
  })
})
