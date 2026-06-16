import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import * as argon2 from 'argon2'
import { ChangePasswordUseCase } from '../../src/application/auth/use-cases/change-password.use-case'
import { UserRepository } from '../../src/domain/repositories/user.repository'

jest.mock('argon2')

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase
  let userRepo: Partial<UserRepository>

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn().mockResolvedValue({ id: 'u1', passwordHash: 'old' }),
      update: jest.fn().mockResolvedValue({}),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChangePasswordUseCase, { provide: UserRepository, useValue: userRepo }],
    }).compile()
    useCase = module.get(ChangePasswordUseCase)
    ;(argon2.verify as jest.Mock).mockResolvedValue(true)
    ;(argon2.hash as jest.Mock).mockResolvedValue('new-hash')
  })

  it('throws when the user is missing', async () => {
    ;(userRepo.findById as jest.Mock).mockResolvedValueOnce(null)
    await expect(useCase.execute('u1', 'cur', 'newPass12')).rejects.toThrow(UnauthorizedException)
  })

  it('throws when the current password is incorrect', async () => {
    ;(argon2.verify as jest.Mock).mockResolvedValueOnce(false)
    await expect(useCase.execute('u1', 'wrong', 'newPass12')).rejects.toThrow(UnauthorizedException)
  })

  it('rehashes and clears mustChangePassword on success', async () => {
    await useCase.execute('u1', 'cur', 'newPass12')
    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      passwordHash: 'new-hash',
      mustChangePassword: false,
    })
  })
})
