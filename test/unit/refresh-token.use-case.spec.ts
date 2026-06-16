import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { RefreshTokenUseCase } from '../../src/application/auth/use-cases/refresh-token.use-case'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { PrismaService } from '../../src/infrastructure/database'

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase
  let userRepo: Partial<UserRepository>
  let jwt: { verifyAsync: jest.Mock; sign: jest.Mock }
  let prisma: { refreshToken: { findUnique: jest.Mock } }

  const future = new Date(Date.now() + 60_000)

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn().mockResolvedValue({ id: 'u1', status: 'active', language: 'es' }),
    }
    jwt = {
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', email: 'a@b.c', role: 'USER' }),
      sign: jest.fn().mockReturnValue('new-access'),
    }
    prisma = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({ revokedAt: null, expiresAt: future }),
      },
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: UserRepository, useValue: userRepo },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()
    useCase = module.get(RefreshTokenUseCase)
  })

  it('throws when the cookie is missing', async () => {
    await expect(useCase.execute(undefined)).rejects.toThrow(UnauthorizedException)
  })

  it('throws on an invalid token', async () => {
    jwt.verifyAsync.mockRejectedValueOnce(new Error('bad'))
    await expect(useCase.execute('tok')).rejects.toThrow(UnauthorizedException)
  })

  it('throws when the stored token is revoked', async () => {
    prisma.refreshToken.findUnique.mockResolvedValueOnce({
      revokedAt: new Date(),
      expiresAt: future,
    })
    await expect(useCase.execute('tok')).rejects.toThrow(UnauthorizedException)
  })

  it('throws when the stored token is expired', async () => {
    prisma.refreshToken.findUnique.mockResolvedValueOnce({
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    })
    await expect(useCase.execute('tok')).rejects.toThrow(UnauthorizedException)
  })

  it('throws when the user is inactive', async () => {
    ;(userRepo.findById as jest.Mock).mockResolvedValueOnce({ id: 'u1', status: 'blocked' })
    await expect(useCase.execute('tok')).rejects.toThrow(UnauthorizedException)
  })

  it('issues a new access token on success', async () => {
    const res = await useCase.execute('tok')
    expect(res.token).toBe('new-access')
    expect(res.expiresIn).toBe(900)
  })
})
