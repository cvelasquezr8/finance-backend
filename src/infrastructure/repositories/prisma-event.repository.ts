import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '@infrastructure/database'
import { BudgetEventRepository } from '@domain/repositories/budget-event.repository'
import { BudgetEventEntity } from '@domain/entities/budget-event.entity'
import { EntityNotFoundException } from '@domain/exceptions/domain.exception'

const includeRelations = {
  participants: true,
  shoppingItems: true,
}

@Injectable()
export class PrismaEventRepository extends BudgetEventRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string): Promise<BudgetEventEntity | null> {
    const event = await this.prisma.budgetEvent.findFirst({
      where: { id, deletedAt: null },
      include: includeRelations,
    })
    return event ? PrismaEventRepository.toEntity(event) : null
  }

  async findByUserId(userId: string): Promise<BudgetEventEntity[]> {
    const events = await this.prisma.budgetEvent.findMany({
      where: {
        deletedAt: null,
        OR: [{ createdBy: userId }, { participants: { some: { userId } } }],
      },
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    })
    return events.map(PrismaEventRepository.toEntity)
  }

  async create(
    data: Omit<
      BudgetEventEntity,
      'id' | 'createdAt' | 'updatedAt' | 'participants' | 'shoppingItems'
    >
  ): Promise<BudgetEventEntity> {
    const event = await this.prisma.budgetEvent.create({
      data: {
        title: data.title,
        description: data.description,
        goalAmount: new Prisma.Decimal(data.goalAmount),
        deadline: data.deadline ?? null,
        createdBy: data.createdBy,
        status: data.status as any,
      },
      include: includeRelations,
    })
    return PrismaEventRepository.toEntity(event)
  }

  async update(id: string, data: Partial<BudgetEventEntity>): Promise<BudgetEventEntity> {
    const event = await this.prisma.budgetEvent.update({
      where: { id },
      data: { status: data.status as any },
      include: includeRelations,
    })
    return PrismaEventRepository.toEntity(event)
  }

  async softDelete(id: string, _localTime?: Date): Promise<BudgetEventEntity> {
    const now = new Date()
    const event = await this.prisma.budgetEvent.findFirst({ where: { id } })
    if (!event) throw new EntityNotFoundException('BudgetEvent', id)
    const updated = await this.prisma.budgetEvent.update({
      where: { id },
      data: { deletedAt: now, status: 'CANCELLED' },
      include: includeRelations,
    })
    return PrismaEventRepository.toEntity(updated)
  }

  async addParticipant(
    eventId: string,
    userId: string,
    alias: string,
    assignedPct: number
  ): Promise<BudgetEventEntity> {
    await this.prisma.eventParticipant.create({
      data: { eventId, userId, alias, assignedPct: new Prisma.Decimal(assignedPct) },
    })
    return this.findById(eventId) as Promise<BudgetEventEntity>
  }

  async updateParticipantStatus(
    eventId: string,
    userId: string,
    status: string,
    respondedAt: Date
  ): Promise<BudgetEventEntity> {
    await this.prisma.eventParticipant.updateMany({
      where: { eventId, userId },
      data: { status: status as any, respondedAt },
    })
    return this.findById(eventId) as Promise<BudgetEventEntity>
  }

  async addShoppingItem(
    eventId: string,
    name: string,
    estimatedCost?: number,
    assignedTo?: string
  ): Promise<BudgetEventEntity> {
    await this.prisma.shoppingItem.create({
      data: {
        eventId,
        name,
        estimatedCost: estimatedCost ? new Prisma.Decimal(estimatedCost) : null,
        assignedTo: assignedTo ?? null,
      },
    })
    return this.findById(eventId) as Promise<BudgetEventEntity>
  }

  async toggleShoppingItem(
    eventId: string,
    itemId: string,
    bought: boolean,
    boughtBy?: string
  ): Promise<BudgetEventEntity> {
    await this.prisma.shoppingItem.update({
      where: { id: itemId },
      data: { bought, boughtBy: bought ? boughtBy : null, boughtAt: bought ? new Date() : null },
    })
    return this.findById(eventId) as Promise<BudgetEventEntity>
  }

  private static toEntity(event: any): BudgetEventEntity {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      goalAmount: Number(event.goalAmount),
      deadline: event.deadline,
      createdBy: event.createdBy,
      status: event.status,
      participants: event.participants.map((p: any) => ({
        id: p.id,
        eventId: p.eventId,
        userId: p.userId,
        alias: p.alias,
        assignedPct: Number(p.assignedPct),
        status: p.status,
        joinedAt: p.joinedAt,
        respondedAt: p.respondedAt,
      })),
      shoppingItems: event.shoppingItems.map((s: any) => ({
        id: s.id,
        eventId: s.eventId,
        name: s.name,
        estimatedCost: s.estimatedCost ? Number(s.estimatedCost) : null,
        bought: s.bought,
        assignedTo: s.assignedTo,
        boughtBy: s.boughtBy,
        boughtAt: s.boughtAt,
        createdAt: s.createdAt,
      })),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      deletedAt: event.deletedAt,
      createdLocalTimeAt: event.createdLocalTimeAt,
      updatedLocalTimeAt: event.updatedLocalTimeAt,
      deletedLocalTimeAt: event.deletedLocalTimeAt,
    }
  }
}
