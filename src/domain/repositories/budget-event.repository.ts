import { BudgetEventEntity } from '../entities/budget-event.entity'

export abstract class BudgetEventRepository {
  abstract findById(id: string): Promise<BudgetEventEntity | null>
  abstract findByUserId(userId: string): Promise<BudgetEventEntity[]>
  abstract create(
    data: Omit<
      BudgetEventEntity,
      'id' | 'createdAt' | 'updatedAt' | 'participants' | 'shoppingItems'
    >
  ): Promise<BudgetEventEntity>
  abstract update(id: string, data: Partial<BudgetEventEntity>): Promise<BudgetEventEntity>
  abstract softDelete(id: string, localTime?: Date): Promise<BudgetEventEntity>
  abstract addParticipant(
    eventId: string,
    userId: string,
    alias: string,
    assignedPct: number
  ): Promise<BudgetEventEntity>
  abstract updateParticipantStatus(
    eventId: string,
    userId: string,
    status: string,
    respondedAt: Date
  ): Promise<BudgetEventEntity>
  abstract addShoppingItem(
    eventId: string,
    name: string,
    estimatedCost?: number,
    assignedTo?: string
  ): Promise<BudgetEventEntity>
  abstract toggleShoppingItem(
    eventId: string,
    itemId: string,
    bought: boolean,
    boughtBy?: string
  ): Promise<BudgetEventEntity>
}
