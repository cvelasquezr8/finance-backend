import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from '@domain/repositories/user.repository'
import { UserEntity, UserRole, UserStatus } from '@domain/entities/user.entity'

@Injectable()
export class AdminService {
  constructor(private readonly userRepo: UserRepository) {}

  async listUsers() {
    const users = await this.userRepo.findAll()
    return users.map(AdminService.toDto)
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
