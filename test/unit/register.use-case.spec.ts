import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as argon2 from 'argon2'
import { RegisterUseCase } from '../../src/application/auth/use-cases/register.use-case'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { PrismaService } from '../../src/infrastructure/database'
import { DuplicateEntityException } from '../../src/domain/exceptions'

jest.mock('argon2')

const input = {
  firstName: 'Ana',
  lastName: 'García',
  email: 'ana@example.com',
  password: 'Secret123!',
  alias: 'ana',
}

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase
  let userRepo: Partial<UserRepository>

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findByAlias: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          ...data,
          id: 'u1',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: UserRepository, useValue: userRepo },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('jwt') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: PrismaService, useValue: { refreshToken: { create: jest.fn() } } },
      ],
    }).compile()
    useCase = module.get(RegisterUseCase)
    ;(argon2.hash as jest.Mock).mockResolvedValue('hashed')
  })

  it('rejects a duplicate email', async () => {
    ;(userRepo.findByEmail as jest.Mock).mockResolvedValueOnce({ id: 'x' })
    await expect(useCase.execute(input)).rejects.toThrow(DuplicateEntityException)
  })

  it('rejects a duplicate alias', async () => {
    ;(userRepo.findByAlias as jest.Mock).mockResolvedValueOnce({ id: 'x' })
    await expect(useCase.execute(input)).rejects.toThrow(DuplicateEntityException)
  })

  it('creates a USER with mustChangePassword=false and returns tokens', async () => {
    const res = await useCase.execute(input)
    expect(argon2.hash).toHaveBeenCalledWith(input.password)
    const created = (userRepo.create as jest.Mock).mock.calls[0][0]
    expect(created.role).toBe('USER')
    expect(created.mustChangePassword).toBe(false)
    expect(res.token).toBe('jwt')
    expect(res.user.email).toBe(input.email)
  })
})
