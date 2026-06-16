import { Injectable } from '@nestjs/common'
import { PrismaService } from '@infrastructure/database'
import {
  NotificationRepository,
  CreateNotificationData,
} from '@domain/repositories/notification.repository'
import { NotificationEntity } from '@domain/entities/notification.entity'

@Injectable()
export class PrismaNotificationRepository extends NotificationRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(PrismaNotificationRepository.toEntity)
  }

  async findByIdForUser(userId: string, id: string): Promise<NotificationEntity | null> {
    const row = await this.prisma.notification.findFirst({ where: { id, userId } })
    return row ? PrismaNotificationRepository.toEntity(row) : null
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, read: false } })
  }

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    const row = await this.prisma.notification.create({ data })
    return PrismaNotificationRepository.toEntity(row)
  }

  async markRead(id: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    })
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({ where: { id } })
  }

  private static toEntity(n: {
    id: string
    userId: string
    type: string
    title: string
    message: string | null
    relatedId: string | null
    read: boolean
    readAt: Date | null
    createdAt: Date
  }): NotificationEntity {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type as NotificationEntity['type'],
      title: n.title,
      message: n.message,
      relatedId: n.relatedId,
      read: n.read,
      readAt: n.readAt,
      createdAt: n.createdAt,
    }
  }
}
