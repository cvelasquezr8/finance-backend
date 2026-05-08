import { TransactionEntity } from '../entities/transaction.entity'

export interface TransactionFilter {
  userId: string
  month?: number
  year?: number
  quincena?: string
  type?: string
  category?: string
}

export abstract class TransactionRepository {
  abstract findById(id: string): Promise<TransactionEntity | null>
  abstract findByFilter(filter: TransactionFilter): Promise<TransactionEntity[]>
  abstract findHistory(
    userId: string,
    year: number,
    type?: string,
    category?: string
  ): Promise<TransactionEntity[]>
  abstract create(
    data: Omit<TransactionEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TransactionEntity>
  abstract update(id: string, data: Partial<TransactionEntity>): Promise<TransactionEntity>
  abstract softDelete(id: string, localTime?: Date): Promise<TransactionEntity>
  abstract sumByType(
    userId: string,
    month: number,
    year: number,
    quincena: string
  ): Promise<Record<string, number>>
}
