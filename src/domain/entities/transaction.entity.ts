export type TransactionType = 'scheduled' | 'daily' | 'income' | 'adjustment'
export type TransactionStatus = 'pending' | 'confirmed' | 'cancelled'
export type QuincenaType = 'primera' | 'segunda'

export interface TransactionEntity {
  id: string
  numericId: number
  userId: string
  description: string
  amount: number
  type: TransactionType
  categoryId: number
  categoryCode: string
  status: TransactionStatus
  quincena: QuincenaType
  dueDay: number
  month: number
  year: number
  isRecurring: boolean
  isCC: boolean
  cardId?: string | null
  eventId?: string | null
  receiptUrl?: string | null
  confirmedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdLocalTimeAt?: Date | null
  updatedLocalTimeAt?: Date | null
  deletedLocalTimeAt?: Date | null
}
