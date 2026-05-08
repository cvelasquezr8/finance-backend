import { CardEntity } from '../entities/card.entity'

export abstract class CardRepository {
  abstract findById(id: string): Promise<CardEntity | null>
  abstract findByUserId(userId: string): Promise<CardEntity[]>
  abstract create(data: Omit<CardEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CardEntity>
  abstract update(id: string, data: Partial<CardEntity>): Promise<CardEntity>
  abstract softDelete(id: string, localTime?: Date): Promise<CardEntity>
}
