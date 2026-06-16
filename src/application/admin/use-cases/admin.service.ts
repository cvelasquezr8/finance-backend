import { Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserRepository } from '@domain/repositories/user.repository'
import { UserEntity, UserRole, UserStatus } from '@domain/entities/user.entity'
import { paginate, PaginateOptions } from '@shared/pagination/paginate'
import { NOTIFICATION_EVENTS } from '@application/notifications/notification.events'

@Injectable()
export class AdminService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly emitter: EventEmitter2
  ) {}

  async listUsers(query: PaginateOptions = {}) {
    const users = (await this.userRepo.findAll()).map(AdminService.toDto)
    return paginate(users, {
      ...query,
      sortBy: query.sortBy ?? 'createdAt',
      order: query.order ?? 'desc',
      searchableKeys: ['email', 'name', 'alias'],
    })
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundException('User not found')
    const updated = await this.userRepo.update(userId, { role })
    return AdminService.toDto(updated)
  }

  async updateStatus(userId: string, status: UserStatus) {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundException('User not found')
    if (status === 'deleted') {
      const deleted = await this.userRepo.softDelete(userId)
      return AdminService.toDto(deleted)
    }
    const updated = await this.userRepo.update(userId, { status })
    if (status === 'blocked') {
      this.emitter.emit(NOTIFICATION_EVENTS.accountBlocked, { recipientUserId: userId })
    }
    return AdminService.toDto(updated)
  }

  private static toDto(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      alias: user.alias,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    }
  }
}
