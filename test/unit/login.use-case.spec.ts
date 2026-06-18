import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UnauthorizedException } from '@nestjs/common'
import * as argon2 from 'argon2'
import { LoginUseCase } from '../../src/application/auth/use-cases/login.use-case'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { PrismaService } from '../../src/infrastructure/database'
import { UserEntity } from '../../src/domain/entities/user.entity'
import { InvalidCredentialsException, AccountLockedException } from '../../src/domain/exceptions'
import { NOTIFICATION_EVENTS } from '../../src/application/notifications/notification.events'

jest.mock('argon2')

const user: UserEntity = {
  id: 'u1',
  numericId: 1,
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
  failedLoginAttempts: 0,
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
  let emitter: { emit: jest.Mock }

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ ...user, ...data })),
    }
    prisma = { refreshToken: { create: jest.fn().mockResolvedValue({}) } }
    emitter = { emit: jest.fn() }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: UserRepository, useValue: userRepo },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('jwt-token') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile()
    useCase = module.get(LoginUseCase)
    ;(argon2.verify as jest.Mock).mockResolvedValue(true)
  })

  it('rejects unknown email', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce(null)
    await expect(useCase.execute('x@y.com', 'p')).rejects.toThrow(UnauthorizedException)
  })

  it('rejects an already-blocked account with AccountLockedException', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce({ ...user, status: 'blocked' })
    await expect(useCase.execute(user.email, 'p')).rejects.toThrow(AccountLockedException)
  })

  it('rejects a deleted account', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce({ ...user, status: 'deleted' })
    await expect(useCase.execute(user.email, 'p')).rejects.toThrow(UnauthorizedException)
  })

  it('increments the counter and reports remaining attempts on a wrong password', async () => {
    ;(argon2.verify as jest.Mock).mockResolvedValueOnce(false)
    await expect(useCase.execute(user.email, 'bad')).rejects.toMatchObject(
      new InvalidCredentialsException(2)
    )
    expect(userRepo.update).toHaveBeenCalledWith('u1', { failedLoginAttempts: 1 })
    expect(emitter.emit).not.toHaveBeenCalled()
  })

  it('blocks the account and emits accountBlocked on the 3rd failure', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce({ ...user, failedLoginAttempts: 2 })
    ;(argon2.verify as jest.Mock).mockResolvedValueOnce(false)
    await expect(useCase.execute(user.email, 'bad')).rejects.toThrow(AccountLockedException)
    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      status: 'blocked',
      failedLoginAttempts: 3,
    })
    expect(emitter.emit).toHaveBeenCalledWith(NOTIFICATION_EVENTS.accountBlocked, {
      recipientUserId: 'u1',
      reason: 'failed_login',
    })
  })

  it('resets the counter to 0 on a successful login', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce({ ...user, failedLoginAttempts: 2 })
    await useCase.execute(user.email, 'good')
    expect(userRepo.update).toHaveBeenCalledWith('u1', { failedLoginAttempts: 0 })
  })

  it('does not write when a clean login succeeds (counter already 0)', async () => {
    await useCase.execute(user.email, 'good')
    expect(userRepo.update).not.toHaveBeenCalled()
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
