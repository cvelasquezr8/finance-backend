import { Injectable, UnauthorizedException } from '@nestjs/common'
import * as argon2 from 'argon2'
import { UserRepository } from '@domain/repositories/user.repository'

@Injectable()
export class ChangePasswordUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await argon2.verify(user.passwordHash, currentPassword)
    if (!valid) throw new UnauthorizedException('Current password is incorrect')

    const passwordHash = await argon2.hash(newPassword)
    await this.userRepo.update(userId, { passwordHash, mustChangePassword: false })
  }
}
