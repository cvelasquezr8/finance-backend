import { NotificationEntity, NotificationType } from '../entities/notification.entity'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string | null
  relatedId: string | null
}

export abstract class NotificationRepository {
  abstract findByUserId(userId: string): Promise<NotificationEntity[]>
  abstract findByIdForUser(userId: string, id: string): Promise<NotificationEntity | null>
  abstract countUnread(userId: string): Promise<number>
  abstract create(data: CreateNotificationData): Promise<NotificationEntity>
  abstract markRead(id: string): Promise<void>
  abstract markAllRead(userId: string): Promise<void>
  abstract delete(id: string): Promise<void>
}
