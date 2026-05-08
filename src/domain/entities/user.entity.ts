export type UserRole = 'ADMIN' | 'USER'
export type UserStatus = 'active' | 'blocked' | 'deleted'

export interface UserEntity {
  id: string
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
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdLocalTimeAt?: Date | null
  updatedLocalTimeAt?: Date | null
  deletedLocalTimeAt?: Date | null
}
