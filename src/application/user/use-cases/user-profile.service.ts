import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import * as argon2 from 'argon2'
import { UserRepository } from '@domain/repositories/user.repository'
import { PrismaService } from '@infrastructure/database'
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
  constructor(
    private readonly userRepo: UserRepository,
    private readonly prisma: PrismaService
  ) {}

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundException('User not found')
    const updated = await this.userRepo.update(userId, input)
    return toUserDto(updated)
  }

  /**
   * Anonymizes all PII and soft-deletes the account.
   * Transactions and event participations are preserved but linked to the
   * anonymized user record so shared data remains intact.
   */
  async deleteMyAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundException('User not found')

    const suffix = randomUUID().replace(/-/g, '').slice(0, 12)
    // Hash a random UUID so the account is cryptographically locked
    const lockedHash = await argon2.hash(randomUUID())

    const now = new Date()

    await this.prisma.$transaction([
      // Revoke all refresh tokens so existing sessions are immediately invalidated
      this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: now },
      }),
      // Anonymize PII and mark as deleted
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'deleted',
          deletedAt: now,
          // Anonymize personal fields
          firstName: 'Deleted',
          lastName: 'User',
          middleName: null,
          secondLastName: null,
          email: `deleted_${suffix}@deleted.invalid`,
          passwordHash: lockedHash,
          alias: `deleted_${suffix}`,
          phone: null,
          avatarUrl: null,
        },
      }),
    ])
  }
}
