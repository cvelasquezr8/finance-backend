import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { EventService } from '../../src/application/event/use-cases/event.service'
import { BudgetEventRepository } from '../../src/domain/repositories/budget-event.repository'
import { TransactionRepository } from '../../src/domain/repositories/transaction.repository'

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'e1',
    title: 'Viaje',
    description: null,
    goalAmount: 1000,
    deadline: null,
    createdBy: 'creator',
    status: 'ACTIVE',
    participants: [],
    shoppingItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('EventService', () => {
  let service: EventService
  let eventRepo: Partial<BudgetEventRepository>
  let txRepo: Partial<TransactionRepository>
  let emitter: { emit: jest.Mock }

  beforeEach(async () => {
    eventRepo = {
      findById: jest.fn().mockResolvedValue(makeEvent()),
      addParticipant: jest.fn().mockResolvedValue(
        makeEvent({
          participants: [
            {
              userId: 'u-bob',
              alias: 'bob',
              assignedPct: 50,
              status: 'PENDING_CONFIRMATION',
              joinedAt: new Date(),
              respondedAt: null,
            },
          ],
        })
      ),
      updateParticipantStatus: jest.fn().mockResolvedValue(
        makeEvent({
          participants: [
            {
              userId: 'u-bob',
              alias: 'bob',
              assignedPct: 50,
              status: 'CONFIRMED',
              joinedAt: new Date(),
              respondedAt: new Date(),
            },
          ],
        })
      ),
      softDelete: jest.fn().mockResolvedValue(undefined),
    }
    txRepo = { findByEventId: jest.fn().mockResolvedValue([]) }
    emitter = { emit: jest.fn() }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: BudgetEventRepository, useValue: eventRepo },
        { provide: TransactionRepository, useValue: txRepo },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile()
    service = module.get(EventService)
  })

  it('only the creator can invite participants', async () => {
    await expect(service.inviteParticipant('e1', 'intruder', 'bob', 50)).rejects.toThrow(
      ForbiddenException
    )
  })

  it('emits participant_invited when the creator invites', async () => {
    await service.inviteParticipant('e1', 'creator', 'bob', 50)
    expect(emitter.emit).toHaveBeenCalledWith(
      'event.participant_invited',
      expect.objectContaining({ recipientUserId: 'u-bob', eventId: 'e1' })
    )
  })

  it('emits participant_responded to the creator on response', async () => {
    await service.respondInvitation('e1', 'u-bob', 'CONFIRMED')
    expect(emitter.emit).toHaveBeenCalledWith(
      'event.participant_responded',
      expect.objectContaining({ recipientUserId: 'creator', status: 'CONFIRMED' })
    )
  })

  it('only the creator can cancel', async () => {
    await expect(service.cancelEvent('e1', 'intruder')).rejects.toThrow(ForbiddenException)
  })

  it('getLinkedTransactions throws NotFound for a missing event', async () => {
    ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(null)
    await expect(service.getLinkedTransactions('nope')).rejects.toThrow(NotFoundException)
  })

  it('returns a paginated envelope for linked transactions', async () => {
    const res = await service.getLinkedTransactions('e1')
    expect(res).toHaveProperty('data')
    expect(res).toHaveProperty('total', 0)
  })
})
