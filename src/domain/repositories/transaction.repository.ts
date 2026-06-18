import { TransactionEntity } from '../entities/transaction.entity'

export interface TransactionFilter {
  userId: string
  month?: number
  year?: number
  quincena?: string
  type?: string
  category?: string
  cardId?: string
  isCC?: boolean
}

export abstract class TransactionRepository {
  abstract findById(id: string): Promise<TransactionEntity | null>
  abstract findByFilter(filter: TransactionFilter): Promise<TransactionEntity[]>
  abstract findByEventId(eventId: string): Promise<TransactionEntity[]>
  abstract findHistory(
    userId: string,
    year: number,
    type?: string,
    category?: string
  ): Promise<TransactionEntity[]>
  abstract create(
    data: Omit<TransactionEntity, 'id' | 'numericId' | 'categoryCode' | 'createdAt' | 'updatedAt'>
  ): Promise<TransactionEntity>
  abstract update(id: string, data: Partial<TransactionEntity>): Promise<TransactionEntity>
  abstract softDelete(id: string, localTime?: Date): Promise<TransactionEntity>
  abstract sumByType(
    userId: string,
    month: number,
    year: number,
    quincena: string
  ): Promise<Record<string, number>>
  abstract findCategoryIdByCode(code: string): Promise<number | null>
  abstract listCategories(): Promise<{ id: number; code: string; nameEs: string; nameEn: string }[]>
}
