import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { CardRepository } from '@domain/repositories/card.repository'
import { CardEntity } from '@domain/entities/card.entity'
import { CreateCardDto } from '@interface/http/card/dto/card.dto'

@Injectable()
export class CardService {
  constructor(private readonly cardRepo: CardRepository) {}

  async listCards(userId: string) {
    const cards = await this.cardRepo.findByUserId(userId)
    return cards.map(CardService.toDto)
  }

  async createCard(userId: string, dto: CreateCardDto) {
    const card = await this.cardRepo.create({
      userId,
      ...dto,
      deletedAt: null,
      createdLocalTimeAt: null,
      updatedLocalTimeAt: null,
      deletedLocalTimeAt: null,
    })
    return CardService.toDto(card)
  }

  async updateCard(userId: string, cardId: string, dto: Partial<CreateCardDto>) {
    const card = await this.cardRepo.findById(cardId)
    if (!card) throw new NotFoundException('Card not found')
    if (card.userId !== userId) throw new ForbiddenException()
    const updated = await this.cardRepo.update(cardId, dto)
    return CardService.toDto(updated)
  }

  async deleteCard(userId: string, cardId: string) {
    const card = await this.cardRepo.findById(cardId)
    if (!card) throw new NotFoundException('Card not found')
    if (card.userId !== userId) throw new ForbiddenException()
    await this.cardRepo.softDelete(cardId)
  }

  private static toDto(card: CardEntity) {
    return {
      id: card.id,
      userId: card.userId,
      name: card.name,
      lastFour: card.lastFour,
      type: card.type,
      createdAt: card.createdAt.toISOString(),
    }
  }
}
