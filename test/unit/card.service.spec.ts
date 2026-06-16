import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { CardService } from '../../src/application/card/use-cases/card.service'
import { CardRepository } from '../../src/domain/repositories/card.repository'

const card = {
  id: 'c1',
  userId: 'u1',
  name: 'Visa',
  lastFour: '1234',
  type: 'CREDIT' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdLocalTimeAt: null,
  updatedLocalTimeAt: null,
  deletedLocalTimeAt: null,
}

describe('CardService', () => {
  let service: CardService
  let repo: Partial<CardRepository>

  beforeEach(async () => {
    repo = {
      findByUserId: jest.fn().mockResolvedValue([card]),
      findById: jest.fn().mockResolvedValue(card),
      create: jest.fn().mockResolvedValue(card),
      update: jest.fn().mockResolvedValue(card),
      softDelete: jest.fn().mockResolvedValue(card),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [CardService, { provide: CardRepository, useValue: repo }],
    }).compile()
    service = module.get(CardService)
  })

  it('lists user cards mapped to dto (no internal fields)', async () => {
    const res = await service.listCards('u1')
    expect(res).toHaveLength(1)
    expect(res[0]).not.toHaveProperty('deletedAt')
  })

  it('rejects update of a card owned by another user', async () => {
    await expect(service.updateCard('other', 'c1', { name: 'X' })).rejects.toThrow(
      ForbiddenException
    )
  })

  it('throws NotFound deleting a missing card', async () => {
    ;(repo.findById as jest.Mock).mockResolvedValueOnce(null)
    await expect(service.deleteCard('u1', 'nope')).rejects.toThrow(NotFoundException)
  })

  it('soft-deletes an owned card', async () => {
    await service.deleteCard('u1', 'c1')
    expect(repo.softDelete).toHaveBeenCalledWith('c1')
  })
})
