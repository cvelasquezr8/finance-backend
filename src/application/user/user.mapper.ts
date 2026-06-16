import { UserEntity } from '@domain/entities/user.entity'

/**
 * Maps a UserEntity to the public user shape consumed by finance-pwa
 * (see finance-pwa/src/core/types User). Never exposes passwordHash.
 */
export function toUserDto(user: UserEntity) {
  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName ?? null,
    secondLastName: user.secondLastName ?? null,
    phone: user.phone ?? null,
    currency: user.currency,
    timezone: user.timezone,
    monthlyNotifications: user.monthlyNotifications,
    avatarUrl: user.avatarUrl ?? null,
    language: user.language,
    theme: user.theme,
    role: user.role,
    status: user.status,
    alias: user.alias,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
  }
}

export type UserDto = ReturnType<typeof toUserDto>
