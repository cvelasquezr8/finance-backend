import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { BudgetEventRepository } from '@domain/repositories/budget-event.repository'
import { BudgetEventEntity } from '@domain/entities/budget-event.entity'

@Injectable()
export class EventService {
  constructor(private readonly eventRepo: BudgetEventRepository) {}

  async listEvents(userId: string) {
    const events = await this.eventRepo.findByUserId(userId)
    return events.map(EventService.toDto)
  }

  async getEvent(id: string) {
    const event = await this.eventRepo.findById(id)
    if (!event) throw new NotFoundException('Event not found')
    return EventService.toDto(event)
  }

  async createEvent(
    userId: string,
    dto: { title: string; description?: string; goalAmount: number; deadline?: string }
  ) {
    const event = await this.eventRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      goalAmount: dto.goalAmount,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      createdBy: userId,
      status: 'ACTIVE',
      deletedAt: null,
      createdLocalTimeAt: null,
      updatedLocalTimeAt: null,
      deletedLocalTimeAt: null,
    })
    return EventService.toDto(event)
  }

  async inviteParticipant(
    eventId: string,
    requesterId: string,
    alias: string,
    assignedPct: number
  ) {
    const event = await this.eventRepo.findById(eventId)
    if (!event) throw new NotFoundException('Event not found')
    if (event.createdBy !== requesterId)
      throw new ForbiddenException('Only the creator can invite participants')
    const updated = await this.eventRepo.addParticipant(eventId, requesterId, alias, assignedPct)
    return EventService.toDto(updated)
  }

  async respondInvitation(eventId: string, userId: string, status: 'CONFIRMED' | 'DECLINED') {
    const event = await this.eventRepo.findById(eventId)
    if (!event) throw new NotFoundException('Event not found')
    const updated = await this.eventRepo.updateParticipantStatus(
      eventId,
      userId,
      status,
      new Date()
    )
    return EventService.toDto(updated)
  }

  async addShoppingItem(
    eventId: string,
    name: string,
    estimatedCost?: number,
    assignedTo?: string
  ) {
    const event = await this.eventRepo.findById(eventId)
    if (!event) throw new NotFoundException('Event not found')
    const updated = await this.eventRepo.addShoppingItem(eventId, name, estimatedCost, assignedTo)
    return EventService.toDto(updated)
  }

  async toggleShoppingItem(eventId: string, itemId: string, userId: string, bought: boolean) {
    const event = await this.eventRepo.findById(eventId)
    if (!event) throw new NotFoundException('Event not found')
    const updated = await this.eventRepo.toggleShoppingItem(eventId, itemId, bought, userId)
    return EventService.toDto(updated)
  }

  async cancelEvent(eventId: string, requesterId: string) {
    const event = await this.eventRepo.findById(eventId)
    if (!event) throw new NotFoundException('Event not found')
    if (event.createdBy !== requesterId)
      throw new ForbiddenException('Only the creator can cancel the event')
    await this.eventRepo.softDelete(eventId)
  }

  private static toDto(event: BudgetEventEntity) {
    return {
      id: event.id,
      title: event.title,
      description: event.description ?? null,
      goalAmount: event.goalAmount,
      deadline: event.deadline?.toISOString() ?? null,
      createdBy: event.createdBy,
      status: event.status,
      participants: event.participants.map((p) => ({
        userId: p.userId,
        alias: p.alias,
        assignedPct: p.assignedPct,
        status: p.status,
        joinedAt: p.joinedAt.toISOString(),
        respondedAt: p.respondedAt?.toISOString() ?? null,
      })),
      shoppingItems: event.shoppingItems.map((s) => ({
        id: s.id,
        name: s.name,
        estimatedCost: s.estimatedCost ?? null,
        bought: s.bought,
        assignedTo: s.assignedTo ?? null,
        boughtBy: s.boughtBy ?? null,
        boughtAt: s.boughtAt?.toISOString() ?? null,
      })),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }
  }
}
