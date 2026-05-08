import { Injectable } from '@nestjs/common'
import { PrismaService } from '@infrastructure/database'
import { CardRepository } from '@domain/repositories/card.repository'
import { CardEntity } from '@domain/entities/card.entity'
import { EntityNotFoundException } from '@domain/exceptions/domain.exception'

@Injectable()
export class PrismaCardRepository extends CardRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string): Promise<CardEntity | null> {
    const card = await this.prisma.card.findFirst({ where: { id, deletedAt: null } })
    return card ? PrismaCardRepository.toEntity(card) : null
  }

  async findByUserId(userId: string): Promise<CardEntity[]> {
    const cards = await this.prisma.card.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
    return cards.map(PrismaCardRepository.toEntity)
  }

  async create(data: Omit<CardEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CardEntity> {
    const card = await this.prisma.card.create({ data: data as any })
    return PrismaCardRepository.toEntity(card)
  }

  async update(id: string, data: Partial<CardEntity>): Promise<CardEntity> {
    const card = await this.prisma.card.update({ where: { id }, data: data as any })
    return PrismaCardRepository.toEntity(card)
  }

  async softDelete(id: string, localTime?: Date): Promise<CardEntity> {
    const now = new Date()
    const card = await this.prisma.card.findFirst({ where: { id } })
    if (!card) throw new EntityNotFoundException('Card', id)
    const updated = await this.prisma.card.update({
      where: { id },
      data: { deletedAt: now, deletedLocalTimeAt: localTime ?? now, updatedAt: now },
    })
    return PrismaCardRepository.toEntity(updated)
  }

  private static toEntity(card: any): CardEntity {
    return {
      id: card.id,
      userId: card.userId,
      name: card.name,
      lastFour: card.lastFour,
      type: card.type,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      deletedAt: card.deletedAt,
      createdLocalTimeAt: card.createdLocalTimeAt,
      updatedLocalTimeAt: card.updatedLocalTimeAt,
      deletedLocalTimeAt: card.deletedLocalTimeAt,
    }
  }
}
