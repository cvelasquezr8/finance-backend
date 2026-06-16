import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from '@domain/repositories/user.repository'
import { toUserDto } from '@application/user/user.mapper'

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  middleName?: string
  secondLastName?: string
  phone?: string
  currency?: string
  timezone?: string
  monthlyNotifications?: boolean
  language?: string
  theme?: string
}

@Injectable()
export class UserProfileService {
  constructor(private readonly userRepo: UserRepository) {}

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundException('User not found')
    const updated = await this.userRepo.update(userId, input)
    return toUserDto(updated)
  }
}
