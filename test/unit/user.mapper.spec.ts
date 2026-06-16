import { toUserDto } from '../../src/application/user/user.mapper'
import { UserEntity } from '../../src/domain/entities/user.entity'

const user: UserEntity = {
  id: 'u1',
  email: 'ana@example.com',
  passwordHash: 'SECRET_HASH',
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
  mustChangePassword: true,
  invitedBy: null,
  invitedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  createdLocalTimeAt: null,
  updatedLocalTimeAt: null,
  deletedLocalTimeAt: null,
}

describe('toUserDto', () => {
  it('never exposes the password hash', () => {
    const dto = toUserDto(user)
    expect(dto).not.toHaveProperty('passwordHash')
  })

  it('composes the full name and serializes createdAt as ISO', () => {
    const dto = toUserDto(user)
    expect(dto.name).toBe('Ana García')
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('includes mustChangePassword for the invitation flow', () => {
    expect(toUserDto(user).mustChangePassword).toBe(true)
  })
})
