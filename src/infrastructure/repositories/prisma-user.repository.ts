import { Injectable } from '@nestjs/common'
import { PrismaService } from '@infrastructure/database'
import { UserRepository } from '@domain/repositories/user.repository'
import { UserEntity } from '@domain/entities/user.entity'
import { EntityNotFoundException } from '@domain/exceptions/domain.exception'

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } })
    return user ? PrismaUserRepository.toEntity(user) : null
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } })
    return user ? PrismaUserRepository.toEntity(user) : null
  }

  async findByAlias(alias: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({ where: { alias, deletedAt: null } })
    return user ? PrismaUserRepository.toEntity(user) : null
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({ where: { deletedAt: null } })
    return users.map(PrismaUserRepository.toEntity)
  }

  async create(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const user = await this.prisma.user.create({ data: data as any })
    return PrismaUserRepository.toEntity(user)
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.prisma.user.update({ where: { id }, data: data as any })
    return PrismaUserRepository.toEntity(user)
  }

  async softDelete(id: string, localTime?: Date): Promise<UserEntity> {
    const now = new Date()
    const user = await this.prisma.user.findFirst({ where: { id } })
    if (!user) throw new EntityNotFoundException('User', id)
    const timezone = user.timezone
    const localNow = localTime ?? this.localNow(timezone)
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: 'deleted',
        deletedAt: now,
        deletedLocalTimeAt: localNow,
        updatedAt: now,
        updatedLocalTimeAt: localNow,
      },
    })
    return PrismaUserRepository.toEntity(updated)
  }

  private static toEntity(user: any): UserEntity {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      secondLastName: user.secondLastName,
      phone: user.phone,
      alias: user.alias,
      currency: user.currency,
      timezone: user.timezone,
      language: user.language,
      theme: user.theme,
      avatarUrl: user.avatarUrl,
      monthlyNotifications: user.monthlyNotifications,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      createdLocalTimeAt: user.createdLocalTimeAt,
      updatedLocalTimeAt: user.updatedLocalTimeAt,
      deletedLocalTimeAt: user.deletedLocalTimeAt,
    }
  }

  private localNow(timezone: string): Date {
    const offsets: Record<string, number> = {
      'America/Mexico_City': -6,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'Europe/Madrid': 1,
    }
    const offset = offsets[timezone] ?? 0
    return new Date(Date.now() + offset * 60 * 60 * 1000)
  }
}
