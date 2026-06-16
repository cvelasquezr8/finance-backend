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
    deletedAt: null,
    createdLocalTimeAt: null,
    updatedLocalTimeAt: null,
    deletedLocalTimeAt: null,
    ...overrides,
  }
}

const confirmedParticipants = [
  {
    id: 'p1',
    eventId: 'e1',
    userId: 'u-bob',
    alias: 'bob',
    assignedPct: 50,
    status: 'CONFIRMED',
    joinedAt: new Date(),
    respondedAt: new Date(),
  },
  {
    id: 'p2',
    eventId: 'e1',
    userId: 'u-alice',
    alias: 'alice',
    assignedPct: 50,
    status: 'CONFIRMED',
    joinedAt: new Date(),
    respondedAt: new Date(),
  },
]

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
              id: 'p1',
              eventId: 'e1',
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
              id: 'p1',
              eventId: 'e1',
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
      update: jest
        .fn()
        .mockImplementation((_id: string, data: Record<string, unknown>) =>
          Promise.resolve(makeEvent({ ...data, participants: [] }))
        ),
      softDelete: jest.fn().mockResolvedValue(undefined),
      toggleShoppingItem: jest.fn().mockResolvedValue(makeEvent()),
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

  // ─── inviteParticipant ─────────────────────────────────────────────────────

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

  // ─── respondInvitation ─────────────────────────────────────────────────────

  it('emits participant_responded to the creator on response', async () => {
    await service.respondInvitation('e1', 'u-bob', 'CONFIRMED')
    expect(emitter.emit).toHaveBeenCalledWith(
      'event.participant_responded',
      expect.objectContaining({ recipientUserId: 'creator', status: 'CONFIRMED' })
    )
  })

  // ─── cancelEvent ───────────────────────────────────────────────────────────

  it('only the creator can cancel', async () => {
    await expect(service.cancelEvent('e1', 'intruder')).rejects.toThrow(ForbiddenException)
  })

  // ─── getLinkedTransactions ─────────────────────────────────────────────────

  it('getLinkedTransactions throws NotFound for a missing event', async () => {
    ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(null)
    await expect(service.getLinkedTransactions('nope')).rejects.toThrow(NotFoundException)
  })

  it('returns a paginated envelope for linked transactions', async () => {
    const res = await service.getLinkedTransactions('e1')
    expect(res).toHaveProperty('data')
    expect(res).toHaveProperty('total', 0)
  })

  // ─── closeEvent ────────────────────────────────────────────────────────────

  describe('closeEvent()', () => {
    it('throws NotFound when event does not exist', async () => {
      ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(null)
      await expect(service.closeEvent('nope', 'creator', 'USER')).rejects.toThrow(NotFoundException)
    })

    it('throws Forbidden when a non-creator non-admin tries to close', async () => {
      await expect(service.closeEvent('e1', 'intruder', 'USER')).rejects.toThrow(ForbiddenException)
    })

    it('allows an ADMIN to close any event', async () => {
      await expect(service.closeEvent('e1', 'admin-id', 'ADMIN')).resolves.not.toThrow()
      expect(eventRepo.update).toHaveBeenCalledWith('e1', { status: 'COMPLETED' })
    })

    it('throws Forbidden when attempting to close a non-ACTIVE event', async () => {
      ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(makeEvent({ status: 'COMPLETED' }))
      await expect(service.closeEvent('e1', 'creator', 'USER')).rejects.toThrow(ForbiddenException)
    })

    it('emits event_closed to each confirmed participant except the requester', async () => {
      ;(eventRepo.update as jest.Mock).mockResolvedValueOnce(
        makeEvent({ status: 'COMPLETED', participants: confirmedParticipants })
      )
      await service.closeEvent('e1', 'creator', 'USER')
      // Both confirmed participants should receive the notification (creator is not a participant here)
      expect(emitter.emit).toHaveBeenCalledTimes(2)
      expect(emitter.emit).toHaveBeenCalledWith(
        'event.closed',
        expect.objectContaining({ recipientUserId: 'u-bob', eventId: 'e1' })
      )
      expect(emitter.emit).toHaveBeenCalledWith(
        'event.closed',
        expect.objectContaining({ recipientUserId: 'u-alice', eventId: 'e1' })
      )
    })

    it('does not emit to the requester even if they are a participant', async () => {
      const participantsIncludingCreator = [
        ...confirmedParticipants,
        {
          id: 'p3',
          eventId: 'e1',
          userId: 'creator',
          alias: 'creator',
          assignedPct: 0,
          status: 'CONFIRMED',
          joinedAt: new Date(),
          respondedAt: new Date(),
        },
      ]
      ;(eventRepo.update as jest.Mock).mockResolvedValueOnce(
        makeEvent({ status: 'COMPLETED', participants: participantsIncludingCreator })
      )
      await service.closeEvent('e1', 'creator', 'USER')
      const emittedRecipients = emitter.emit.mock.calls.map((c) => c[1].recipientUserId)
      expect(emittedRecipients).not.toContain('creator')
    })
  })

  // ─── reopenEvent ───────────────────────────────────────────────────────────

  describe('reopenEvent()', () => {
    it('throws NotFound when event does not exist', async () => {
      ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(null)
      await expect(service.reopenEvent('nope', 'creator', 'USER')).rejects.toThrow(
        NotFoundException
      )
    })

    it('throws Forbidden when a non-creator non-admin tries to reopen', async () => {
      ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(makeEvent({ status: 'COMPLETED' }))
      await expect(service.reopenEvent('e1', 'intruder', 'USER')).rejects.toThrow(
        ForbiddenException
      )
    })

    it('throws Forbidden when attempting to reopen a non-COMPLETED event', async () => {
      // event is ACTIVE by default
      await expect(service.reopenEvent('e1', 'creator', 'USER')).rejects.toThrow(ForbiddenException)
    })

    it('allows an ADMIN to reopen any closed event', async () => {
      ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(makeEvent({ status: 'COMPLETED' }))
      await expect(service.reopenEvent('e1', 'admin-id', 'ADMIN')).resolves.not.toThrow()
      expect(eventRepo.update).toHaveBeenCalledWith('e1', { status: 'ACTIVE' })
    })

    it('emits event_reopened to each confirmed participant except the requester', async () => {
      ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(makeEvent({ status: 'COMPLETED' }))
      ;(eventRepo.update as jest.Mock).mockResolvedValueOnce(
        makeEvent({ status: 'ACTIVE', participants: confirmedParticipants })
      )
      await service.reopenEvent('e1', 'creator', 'USER')
      expect(emitter.emit).toHaveBeenCalledTimes(2)
      expect(emitter.emit).toHaveBeenCalledWith(
        'event.reopened',
        expect.objectContaining({ recipientUserId: 'u-bob' })
      )
      expect(emitter.emit).toHaveBeenCalledWith(
        'event.reopened',
        expect.objectContaining({ recipientUserId: 'u-alice' })
      )
    })
  })

  // ─── toggleShoppingItem ────────────────────────────────────────────────────

  describe('toggleShoppingItem()', () => {
    it('throws NotFound when event does not exist', async () => {
      ;(eventRepo.findById as jest.Mock).mockResolvedValueOnce(null)
      await expect(service.toggleShoppingItem('nope', 'item-1', 'u1', true)).rejects.toThrow(
        NotFoundException
      )
    })

    it('delegates to the repository and returns updated event DTO', async () => {
      const result = await service.toggleShoppingItem('e1', 'item-1', 'u1', true)
      expect(eventRepo.toggleShoppingItem).toHaveBeenCalledWith('e1', 'item-1', true, 'u1')
      expect(result).toHaveProperty('id', 'e1')
    })
  })
})
