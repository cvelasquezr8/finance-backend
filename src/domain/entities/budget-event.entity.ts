export type EventStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type ParticipantStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DECLINED'

export interface EventParticipantEntity {
  id: string
  eventId: string
  userId: string
  alias: string
  assignedPct: number
  status: ParticipantStatus
  joinedAt: Date
  respondedAt?: Date | null
}

export interface ShoppingItemEntity {
  id: string
  eventId: string
  name: string
  estimatedCost?: number | null
  bought: boolean
  assignedTo?: string | null
  boughtBy?: string | null
  boughtAt?: Date | null
  createdAt: Date
}

export interface BudgetEventEntity {
  id: string
  title: string
  description?: string | null
  goalAmount: number
  deadline?: Date | null
  createdBy: string
  status: EventStatus
  participants: EventParticipantEntity[]
  shoppingItems: ShoppingItemEntity[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdLocalTimeAt?: Date | null
  updatedLocalTimeAt?: Date | null
  deletedLocalTimeAt?: Date | null
}
