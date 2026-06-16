export type NotificationType =
  | 'event_invitation'
  | 'invitation_response'
  | 'event_closed'
  | 'event_reopened'
  | 'account_invited'
  | 'account_blocked'
  | 'monthly_summary'

export interface NotificationEntity {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string | null
  relatedId: string | null
  read: boolean
  readAt: Date | null
  createdAt: Date
}
