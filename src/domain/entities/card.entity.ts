export type CardType = 'CREDIT' | 'DEBIT'

export interface CardEntity {
  id: string
  userId: string
  name: string
  lastFour: string
  type: CardType
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdLocalTimeAt?: Date | null
  updatedLocalTimeAt?: Date | null
  deletedLocalTimeAt?: Date | null
}
