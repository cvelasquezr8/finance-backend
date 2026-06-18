import { Test, TestingModule } from '@nestjs/testing'
import { TransactionService } from '../../src/application/transaction/use-cases/transaction.service'
import { TransactionRepository } from '../../src/domain/repositories/transaction.repository'
import { TransactionEntity } from '../../src/domain/entities/transaction.entity'
import { NotFoundException, ForbiddenException } from '@nestjs/common'

const mockTx: TransactionEntity = {
  id: 'tx-1',
  numericId: 1,
  userId: 'user-1',
  description: 'Café',
  amount: 50,
  type: 'daily',
  categoryId: 1,
  categoryCode: 'alimentacion',
  status: 'confirmed',
  quincena: 'primera',
  dueDay: 7,
  month: 5,
  year: 2026,
  isRecurring: false,
  isCC: false,
  cardId: null,
  eventId: null,
  receiptUrl: null,
  confirmedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdLocalTimeAt: null,
  updatedLocalTimeAt: null,
  deletedLocalTimeAt: null,
}

const mockRepo: Partial<TransactionRepository> = {
  findByFilter: jest.fn().mockResolvedValue([mockTx]),
  findById: jest.fn().mockResolvedValue(mockTx),
  create: jest.fn().mockResolvedValue(mockTx),
  update: jest.fn().mockResolvedValue(mockTx),
  softDelete: jest.fn().mockResolvedValue(mockTx),
  findHistory: jest.fn().mockResolvedValue([mockTx]),
  sumByType: jest.fn().mockResolvedValue({}),
  findCategoryIdByCode: jest.fn().mockResolvedValue(1),
  listCategories: jest.fn().mockResolvedValue([]),
}

describe('TransactionService', () => {
  let service: TransactionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionService, { provide: TransactionRepository, useValue: mockRepo }],
    }).compile()
    service = module.get<TransactionService>(TransactionService)
  })

  describe('list()', () => {
    it('returns paginated transactions', async () => {
      const result = await service.list('user-1', 5, 2026, 'primera')
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('create()', () => {
    it('creates a daily transaction with status confirmed', async () => {
      const dto = {
        description: 'Café',
        amount: 50,
        type: 'daily' as const,
        category: 'alimentacion',
        quincena: 'primera' as const,
        dueDay: 7,
        month: 5,
        year: 2026,
        isRecurring: false,
        isCC: false,
      }
      const result = await service.create('user-1', dto, 'America/Mexico_City')
      expect(mockRepo.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('remove()', () => {
    it('throws ForbiddenException if user does not own transaction', async () => {
      await expect(service.remove('other-user', 'tx-1', 'America/Mexico_City')).rejects.toThrow(
        ForbiddenException
      )
    })

    it('throws NotFoundException if transaction not found', async () => {
      jest.spyOn(mockRepo, 'findById').mockResolvedValueOnce(null)
      await expect(service.remove('user-1', 'tx-404', 'America/Mexico_City')).rejects.toThrow(
        NotFoundException
      )
    })

    it('soft deletes owned transaction', async () => {
      await service.remove('user-1', 'tx-1', 'America/Mexico_City')
      expect(mockRepo.softDelete).toHaveBeenCalledWith('tx-1', expect.any(Date))
    })
  })
})
