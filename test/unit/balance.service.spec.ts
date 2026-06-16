import { Test, TestingModule } from '@nestjs/testing'
import { BalanceService } from '../../src/application/balance/use-cases/balance.service'
import { TransactionRepository } from '../../src/domain/repositories/transaction.repository'
import { PrismaService } from '../../src/infrastructure/database'

describe('BalanceService', () => {
  let service: BalanceService
  let txRepo: Partial<TransactionRepository>
  let prisma: {
    balanceAdjustment: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock }
  }

  beforeEach(async () => {
    txRepo = {
      sumByType: jest.fn().mockResolvedValue({
        income_confirmed_cash: 1000,
        scheduled_confirmed_cash: 200,
        scheduled_pending_cash: 50,
        daily_confirmed_cash: 100,
        deuda_confirmed_cc: 300, // CC debt — excluded from cash balance
      }),
      create: jest.fn().mockResolvedValue({}),
    }
    prisma = {
      balanceAdjustment: {
        findMany: jest.fn().mockResolvedValue([{ newBalance: 5000 }]),
        findFirst: jest.fn().mockResolvedValue({ newBalance: 5000 }),
        create: jest.fn().mockResolvedValue({}),
      },
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        { provide: TransactionRepository, useValue: txRepo },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()
    service = module.get(BalanceService)
  })

  it('computes cash balance excluding credit-card debt', async () => {
    const s = await service.getSummary('u1', 6, 2026, 'primera')
    // 5000 + 1000 income - 200 confirmed - 100 daily = 5700
    expect(s.currentBalance).toBe(5700)
    // 5700 - 50 pending = 5650
    expect(s.projectedBalance).toBe(5650)
    expect(s.totalDebt).toBe(300)
    expect(s.expectedIncome).toBe(1000)
    expect(s.initialBalance).toBe(5000)
  })

  it('addIncome creates a confirmed income transaction', async () => {
    await service.addIncome('u1', 'Salario', 12000, 'America/Mexico_City')
    const created = (txRepo.create as jest.Mock).mock.calls[0][0]
    expect(created.type).toBe('income')
    expect(created.status).toBe('confirmed')
    expect(created.amount).toBe(12000)
  })
})
