export type UserRole = 'ADMIN' | 'USER'
export type UserStatus = 'active' | 'blocked' | 'deleted'

export interface UserEntity {
  id: string
  numericId: number
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  middleName?: string | null
  secondLastName?: string | null
  phone?: string | null
  alias: string
  currency: string
  timezone: string
  language: string
  theme: string
  avatarUrl?: string | null
  monthlyNotifications: boolean
  role: UserRole
  status: UserStatus
  failedLoginAttempts: number
  mustChangePassword: boolean
  invitedBy?: string | null
  invitedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdLocalTimeAt?: Date | null
  updatedLocalTimeAt?: Date | null
  deletedLocalTimeAt?: Date | null
}
